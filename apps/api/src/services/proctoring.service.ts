import { Server as SocketIOServer, Socket } from 'socket.io';
import { getRedisClient } from '../config/redis';
import { getPrismaClient } from '../config/database';

export interface ProctoringEvent {
  type: string;
  timestamp: Date;
  details?: any;
}

export class ProctoringService {
  private redis = getRedisClient();
  private prisma = getPrismaClient();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Setup WebSocket handlers for proctoring
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Proctoring client connected: ${socket.id}`);

      // Session start
      socket.on('session:start', async (data) => {
        await this.handleSessionStart(socket, data);
      });

      // Tab switch detection
      socket.on('proctoring:tab_switch', async (data) => {
        await this.handleTabSwitch(socket, data);
      });

      // Window blur detection
      socket.on('proctoring:window_blur', async (data) => {
        await this.handleWindowBlur(socket, data);
      });

      // Paste attempt
      socket.on('proctoring:paste_attempt', async (data) => {
        await this.handlePasteAttempt(socket, data);
      });

      // Inactivity
      socket.on('proctoring:inactivity', async (data) => {
        await this.handleInactivity(socket, data);
      });

      // Keystroke rhythm
      socket.on('proctoring:keystroke', async (data) => {
        await this.handleKeystroke(socket, data);
      });

      // Fullscreen exit
      socket.on('proctoring:fullscreen_exit', async (data) => {
        await this.handleFullscreenExit(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Proctoring client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Handle session start
   */
  private async handleSessionStart(socket: Socket, data: any): Promise<void> {
    const { sessionToken, ipAddress, deviceFingerprint } = data;

    // Check device cooldown (30 days)
    const cooldownKey = `device:cooldown:${deviceFingerprint}`;
    const lastAssessment = await this.redis.get(cooldownKey);

    if (lastAssessment) {
      socket.emit('proctoring:blocked', {
        reason: 'Device is on cooldown. Please wait 30 days between assessments.'
      });
      socket.disconnect();
      return;
    }

    // Store session data in Redis
    const sessionKey = `assessment:session:${sessionToken}`;
    await this.redis.setex(
      sessionKey,
      9000, // 2.5 hours
      JSON.stringify({
        socketId: socket.id,
        ipAddress,
        deviceFingerprint,
        startedAt: new Date().toISOString(),
        tabSwitchCount: 0,
        windowBlurCount: 0,
        pasteAttempts: 0,
        keystrokeBaseline: null
      })
    );

    // Log event
    await this.logProctoringEvent(sessionToken, {
      type: 'session_start',
      timestamp: new Date(),
      details: { ipAddress, deviceFingerprint }
    });

    socket.emit('proctoring:session_started', { success: true });
  }

  /**
   * Handle tab switch
   * First = warning, Second = flag, Third = auto-submit with penalty
   */
  private async handleTabSwitch(socket: Socket, data: any): Promise<void> {
    const { sessionToken } = data;
    const sessionKey = `assessment:session:${sessionToken}`;
    const sessionData = await this.getSessionData(sessionKey);

    if (!sessionData) return;

    sessionData.tabSwitchCount++;

    await this.logProctoringEvent(sessionToken, {
      type: 'tab_switch',
      timestamp: new Date(),
      details: { count: sessionData.tabSwitchCount }
    });

    if (sessionData.tabSwitchCount === 1) {
      socket.emit('proctoring:warning', {
        message: 'Warning: Tab switching detected. Next violation will be flagged.'
      });
    } else if (sessionData.tabSwitchCount === 2) {
      socket.emit('proctoring:flagged', {
        message: 'Violation flagged: Multiple tab switches detected.'
      });
      await this.flagAssessment(sessionToken, 'tab_switch');
    } else if (sessionData.tabSwitchCount >= 3) {
      socket.emit('proctoring:auto_submit', {
        message: 'Assessment auto-submitted due to repeated violations.',
        penalty: true
      });
      await this.autoSubmitAssessment(sessionToken, 'tab_switch_violation');
      socket.disconnect();
      return;
    }

    await this.redis.setex(sessionKey, 9000, JSON.stringify(sessionData));
  }

  /**
   * Handle window blur (same escalation as tab switch)
   */
  private async handleWindowBlur(socket: Socket, data: any): Promise<void> {
    const { sessionToken } = data;
    const sessionKey = `assessment:session:${sessionToken}`;
    const sessionData = await this.getSessionData(sessionKey);

    if (!sessionData) return;

    sessionData.windowBlurCount++;

    await this.logProctoringEvent(sessionToken, {
      type: 'window_blur',
      timestamp: new Date(),
      details: { count: sessionData.windowBlurCount }
    });

    if (sessionData.windowBlurCount === 1) {
      socket.emit('proctoring:warning', {
        message: 'Warning: Window focus lost. Please stay focused on the assessment.'
      });
    } else if (sessionData.windowBlurCount === 2) {
      socket.emit('proctoring:flagged', {
        message: 'Violation flagged: Multiple focus losses detected.'
      });
      await this.flagAssessment(sessionToken, 'window_blur');
    } else if (sessionData.windowBlurCount >= 3) {
      socket.emit('proctoring:auto_submit', {
        message: 'Assessment auto-submitted due to repeated violations.',
        penalty: true
      });
      await this.autoSubmitAssessment(sessionToken, 'window_blur_violation');
      socket.disconnect();
      return;
    }

    await this.redis.setex(sessionKey, 9000, JSON.stringify(sessionData));
  }

  /**
   * Handle paste attempt
   */
  private async handlePasteAttempt(socket: Socket, data: any): Promise<void> {
    const { sessionToken } = data;
    const sessionKey = `assessment:session:${sessionToken}`;
    const sessionData = await this.getSessionData(sessionKey);

    if (!sessionData) return;

    sessionData.pasteAttempts++;

    await this.logProctoringEvent(sessionToken, {
      type: 'paste_attempt',
      timestamp: new Date(),
      details: { count: sessionData.pasteAttempts }
    });

    socket.emit('proctoring:warning', {
      message: 'Paste operation blocked. All paste attempts are logged.'
    });

    await this.redis.setex(sessionKey, 9000, JSON.stringify(sessionData));
  }

  /**
   * Handle inactivity
   * Warn at 90s, auto-pause at 3min, auto-submit at 5min
   */
  private async handleInactivity(socket: Socket, data: any): Promise<void> {
    const { sessionToken, inactiveSeconds } = data;

    await this.logProctoringEvent(sessionToken, {
      type: 'inactivity_warning',
      timestamp: new Date(),
      details: { inactiveSeconds }
    });

    if (inactiveSeconds >= 300) {
      // 5 minutes - auto submit
      socket.emit('proctoring:auto_submit', {
        message: 'Assessment auto-submitted due to prolonged inactivity.',
        penalty: false
      });
      await this.autoSubmitAssessment(sessionToken, 'inactivity');
      socket.disconnect();
    } else if (inactiveSeconds >= 180) {
      // 3 minutes - auto pause
      socket.emit('proctoring:auto_pause', {
        message: 'Assessment paused due to inactivity.'
      });
      await this.pauseAssessment(sessionToken);
    } else if (inactiveSeconds >= 90) {
      // 90 seconds - warning
      socket.emit('proctoring:warning', {
        message: 'Inactivity detected. Please continue with the assessment.'
      });
    }
  }

  /**
   * Handle keystroke rhythm analysis
   */
  private async handleKeystroke(socket: Socket, data: any): Promise<void> {
    const { sessionToken, typingSpeed, burstDetected } = data;
    const sessionKey = `assessment:session:${sessionToken}`;
    const sessionData = await this.getSessionData(sessionKey);

    if (!sessionData) return;

    // Set baseline if not set
    if (!sessionData.keystrokeBaseline) {
      sessionData.keystrokeBaseline = typingSpeed;
      await this.redis.setex(sessionKey, 9000, JSON.stringify(sessionData));
      return;
    }

    // Check for anomalies (burst typing - possible paste or external help)
    if (burstDetected || typingSpeed > sessionData.keystrokeBaseline * 2) {
      await this.logProctoringEvent(sessionToken, {
        type: 'keystroke_anomaly',
        timestamp: new Date(),
        details: { typingSpeed, baseline: sessionData.keystrokeBaseline }
      });

      socket.emit('proctoring:flagged', {
        message: 'Unusual typing pattern detected.'
      });

      await this.flagAssessment(sessionToken, 'keystroke_anomaly');
    }
  }

  /**
   * Handle fullscreen exit
   */
  private async handleFullscreenExit(socket: Socket, data: any): Promise<void> {
    const { sessionToken } = data;

    await this.logProctoringEvent(sessionToken, {
      type: 'fullscreen_exit',
      timestamp: new Date()
    });

    socket.emit('proctoring:pause_required', {
      message: 'Assessment paused. Please re-enter fullscreen to continue.'
    });

    await this.pauseAssessment(sessionToken);
  }

  /**
   * Get session data from Redis
   */
  private async getSessionData(sessionKey: string): Promise<any> {
    const data = await this.redis.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Log proctoring event
   */
  private async logProctoringEvent(
    sessionToken: string,
    event: ProctoringEvent
  ): Promise<void> {
    const eventsKey = `assessment:events:${sessionToken}`;
    const events = await this.redis.get(eventsKey);
    const eventsList = events ? JSON.parse(events) : [];

    eventsList.push(event);

    await this.redis.setex(eventsKey, 9000, JSON.stringify(eventsList));
  }

  /**
   * Flag assessment for violation
   */
  private async flagAssessment(sessionToken: string, _reason: string): Promise<void> {
    await this.prisma.assessment.updateMany({
      where: { sessionToken },
      data: { proctoringViolation: true }
    });
  }

  /**
   * Auto-submit assessment
   */
  private async autoSubmitAssessment(
    sessionToken: string,
    _reason: string
  ): Promise<void> {
    await this.prisma.assessment.updateMany({
      where: { sessionToken },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        proctoringViolation: true
      }
    });

    // Set device cooldown
    const sessionKey = `assessment:session:${sessionToken}`;
    const sessionData = await this.getSessionData(sessionKey);
    
    if (sessionData?.deviceFingerprint) {
      const cooldownKey = `device:cooldown:${sessionData.deviceFingerprint}`;
      await this.redis.setex(cooldownKey, 30 * 24 * 60 * 60, 'blocked'); // 30 days
    }
  }

  /**
   * Pause assessment
   */
  private async pauseAssessment(sessionToken: string): Promise<void> {
    await this.prisma.assessment.updateMany({
      where: { sessionToken },
      data: { status: 'paused' }
    });
  }
}
