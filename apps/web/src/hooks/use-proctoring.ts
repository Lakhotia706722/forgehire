'use client';

import * as React from 'react';
import { apiFetch } from '@/lib/api-fetch';

export type ProctoringEventType =
  | 'tab_switch'
  | 'fullscreen_exit'
  | 'paste_attempt'
  | 'copy_attempt'
  | 'inactivity_warning'
  | 'inactivity_flag'
  | 'window_blur'
  | 'suspicious_keystroke';

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: string;
  count: number;
  details?: string;
}

interface UseProctoringOptions {
  assessmentId: string | null;
  enabled: boolean;
  onForceSubmit: () => void;
}

interface UseProctoringResult {
  tabSwitchCount: number;
  showTabWarning: boolean;
  showFullscreenOverlay: boolean;
  showInactivityWarning: boolean;
  inactivityCountdown: number;
  acknowledgeTabWarning: () => void;
  dismissInactivityWarning: () => void;
}

export function useProctoring({
  assessmentId,
  enabled,
  onForceSubmit,
}: UseProctoringOptions): UseProctoringResult {
  const [tabSwitchCount, setTabSwitchCount] = React.useState(0);
  const [showTabWarning, setShowTabWarning] = React.useState(false);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = React.useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = React.useState(false);
  const [inactivityCountdown, setInactivityCountdown] = React.useState(180);
  const countsRef = React.useRef<Record<ProctoringEventType, number>>({
    tab_switch: 0,
    fullscreen_exit: 0,
    paste_attempt: 0,
    copy_attempt: 0,
    inactivity_warning: 0,
    inactivity_flag: 0,
    window_blur: 0,
    suspicious_keystroke: 0,
  });
  const lastInputRef = React.useRef<number>(Date.now());
  const inactivityFlagSentRef = React.useRef(false);

  const postEvent = React.useCallback(
    async (type: ProctoringEventType, details?: string) => {
      if (!assessmentId) return;
      countsRef.current[type] = (countsRef.current[type] ?? 0) + 1;
      const payload: ProctoringEvent = {
        type,
        timestamp: new Date().toISOString(),
        count: countsRef.current[type],
        details,
      };
      try {
        await apiFetch(`/api/assessment/${assessmentId}/proctor-event`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        // Ignore proctoring logging errors to avoid blocking exam.
      }
    },
    [assessmentId],
  );

  React.useEffect(() => {
    if (!enabled) return;
    document.documentElement.requestFullscreen?.().catch(() => {
      setShowFullscreenOverlay(true);
    });
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const next = c + 1;
          void postEvent('tab_switch');
          if (next >= 3) {
            onForceSubmit();
          } else {
            setShowTabWarning(true);
          }
          return next;
        });
      }
    };

    const handleFullscreen = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      if (!isFullscreen) {
        setShowFullscreenOverlay(true);
        void postEvent('fullscreen_exit');
      } else {
        setShowFullscreenOverlay(false);
      }
    };

    const handleContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCopy = (e.ctrlKey || e.metaKey) && key === 'c';
      const isPaste = (e.ctrlKey || e.metaKey) && key === 'v';
      const isCut = (e.ctrlKey || e.metaKey) && key === 'x';

      if (isCopy || isPaste || isCut) {
        e.preventDefault();
        if (isPaste) void postEvent('paste_attempt');
        if (isCopy || isCut) void postEvent('copy_attempt');
      }

      const now = Date.now();
      const delta = now - lastInputRef.current;
      lastInputRef.current = now;
      if (delta > 0 && delta < 20) {
        void postEvent('suspicious_keystroke', `delta_ms=${delta}`);
      }
    };

    const handleBlur = () => {
      void postEvent('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, onForceSubmit, postEvent]);

  React.useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      const inactiveSeconds = Math.floor((now - lastInputRef.current) / 1000);
      const left = Math.max(0, 180 - inactiveSeconds);
      setInactivityCountdown(left);

      if (inactiveSeconds >= 90 && inactiveSeconds < 180) {
        setShowInactivityWarning(true);
        void postEvent('inactivity_warning');
      }
      if (inactiveSeconds >= 180 && !inactivityFlagSentRef.current) {
        inactivityFlagSentRef.current = true;
        void postEvent('inactivity_flag');
      }
      if (inactiveSeconds >= 300) {
        onForceSubmit();
      }
    }, 1000);

    const updateActivity = () => {
      lastInputRef.current = Date.now();
      inactivityFlagSentRef.current = false;
    };
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [enabled, onForceSubmit, postEvent]);

  return {
    tabSwitchCount,
    showTabWarning,
    showFullscreenOverlay,
    showInactivityWarning,
    inactivityCountdown,
    acknowledgeTabWarning: () => setShowTabWarning(false),
    dismissInactivityWarning: () => {
      setShowInactivityWarning(false);
      lastInputRef.current = Date.now();
      inactivityFlagSentRef.current = false;
    },
  };
}

