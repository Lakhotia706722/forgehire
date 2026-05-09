import { PrismaClient, MessageRequestStatus } from '@prisma/client';
import { S3UploadService } from './s3-upload.service';

export class MessagingService {
  private prisma: PrismaClient;
  private s3Service: S3UploadService;

  // Regex patterns for off-platform detection
  private phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/g;
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private whatsappRegex = /whatsapp|wa\.me|chat\.whatsapp\.com/gi;

  constructor() {
    this.prisma = new PrismaClient();
    this.s3Service = new S3UploadService();
  }

  /**
   * Send message request
   */
  async sendMessageRequest(fromUserId: string, toUserId: string, message: string) {
    // Check if request already exists
    const existing = await this.prisma.messageRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId
        }
      }
    });

    if (existing) {
      if (existing.status === MessageRequestStatus.pending) {
        throw new Error('Message request already sent');
      }
      if (existing.status === MessageRequestStatus.approved) {
        throw new Error('Already connected - send message directly');
      }
      if (existing.status === MessageRequestStatus.declined) {
        throw new Error('Previous request was declined');
      }
    }

    return await this.prisma.messageRequest.create({
      data: {
        fromUserId,
        toUserId,
        message,
        status: MessageRequestStatus.pending
      },
      include: {
        fromUser: {
          select: {
            id: true,
            email: true,
            role: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Respond to message request
   */
  async respondToMessageRequest(
    requestId: string,
    userId: string,
    approve: boolean
  ) {
    const request = await this.prisma.messageRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Message request not found');
    }

    if (request.toUserId !== userId) {
      throw new Error('Unauthorized');
    }

    if (request.status !== MessageRequestStatus.pending) {
      throw new Error('Request already responded to');
    }

    const status = approve ? MessageRequestStatus.approved : MessageRequestStatus.declined;

    const updatedRequest = await this.prisma.messageRequest.update({
      where: { id: requestId },
      data: {
        status,
        respondedAt: new Date()
      }
    });

    // If approved, create conversation
    if (approve) {
      await this.createConversation(request.fromUserId, request.toUserId);
    }

    return updatedRequest;
  }

  /**
   * Create conversation between two users
   */
  private async createConversation(user1Id: string, user2Id: string) {
    // Ensure consistent ordering
    const [participant1Id, participant2Id] = [user1Id, user2Id].sort();

    const existing = await this.prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id,
          participant2Id
        }
      }
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.conversation.create({
      data: {
        participant1Id,
        participant2Id
      }
    });
  }

  /**
   * Send message
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ) {
    // Check if conversation exists
    const [participant1Id, participant2Id] = [senderId, recipientId].sort();

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id,
          participant2Id
        }
      }
    });

    if (!conversation) {
      // Check if message request was approved
      const request = await this.prisma.messageRequest.findFirst({
        where: {
          OR: [
            { fromUserId: senderId, toUserId: recipientId },
            { fromUserId: recipientId, toUserId: senderId }
          ],
          status: MessageRequestStatus.approved
        }
      });

      if (!request) {
        throw new Error('No approved message request found. Send a message request first.');
      }

      conversation = await this.createConversation(senderId, recipientId);
    }

    // Detect off-platform content
    const violation = this.detectOffPlatformContent(content);

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
        fileUrl,
        fileName,
        fileSize,
        flagged: violation !== null
      }
    });

    // Update conversation last message time
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    });

    // Handle violation
    if (violation) {
      await this.handleOffPlatformViolation(senderId, violation, message.id);
    }

    return message;
  }

  /**
   * Detect off-platform content
   */
  detectOffPlatformContent(content: string): string | null {
    if (this.phoneRegex.test(content)) {
      return 'phone';
    }
    if (this.emailRegex.test(content)) {
      return 'email';
    }
    if (this.whatsappRegex.test(content)) {
      return 'whatsapp';
    }
    return null;
  }

  /**
   * Handle off-platform violation
   */
  private async handleOffPlatformViolation(
    userId: string,
    violationType: string,
    messageId: string
  ) {
    // Check previous violations
    const previousViolations = await this.prisma.offPlatformViolation.count({
      where: { userId }
    });

    const level = previousViolations === 0 ? 'warning' : 'review';

    await this.prisma.offPlatformViolation.create({
      data: {
        userId,
        violationType,
        detectedContent: 'Content flagged',
        messageId,
        level,
        warningIssued: level === 'warning',
        warningIssuedAt: level === 'warning' ? new Date() : undefined,
        reviewRequired: level === 'review'
      }
    });

    // TODO: Send notification to user about violation
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        participant1: {
          select: {
            id: true,
            email: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            email: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return conversations.map(conv => ({
      ...conv,
      otherParticipant: conv.participant1Id === userId ? conv.participant2 : conv.participant1,
      lastMessage: conv.messages[0] || null
    }));
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    cursor?: string
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error('Unauthorized');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }

  /**
   * Upload file for message
   */
  async uploadMessageFile(file: Buffer, fileName: string, mimeType: string) {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.length > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    const key = `messages/${Date.now()}-${fileName}`;
    const url = await this.s3Service.uploadBuffer(file, key, mimeType);

    return {
      url,
      fileName,
      fileSize: file.length
    };
  }

  /**
   * Get pending message requests
   */
  async getPendingMessageRequests(userId: string) {
    return await this.prisma.messageRequest.findMany({
      where: {
        toUserId: userId,
        status: MessageRequestStatus.pending
      },
      include: {
        fromUser: {
          select: {
            id: true,
            email: true,
            role: true,
            engineerProfile: {
              select: {
                fullName: true,
                neuronScore: true
              }
            },
            companyProfile: {
              select: {
                companyName: true,
                trustScore: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Send project chat message
   */
  async sendProjectChatMessage(
    roomId: string,
    senderId: string,
    content: string,
    fileUrl?: string,
    fileName?: string
  ) {
    // Check if user is participant
    const participant = await this.prisma.projectChatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: senderId
        }
      }
    });

    if (!participant) {
      throw new Error('Not a participant of this project room');
    }

    return await this.prisma.projectChatMessage.create({
      data: {
        roomId,
        senderId,
        content,
        fileUrl,
        fileName
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get project chat messages
   */
  async getProjectChatMessages(roomId: string, userId: string, limit = 50) {
    // Check if user is participant
    const participant = await this.prisma.projectChatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (!participant) {
      throw new Error('Not a participant of this project room');
    }

    return await this.prisma.projectChatMessage.findMany({
      where: { roomId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            engineerProfile: {
              select: {
                fullName: true
              }
            },
            companyProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
  }
}
