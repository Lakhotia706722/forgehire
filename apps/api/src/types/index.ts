// Re-export types from shared package
export * from '@neuronhire/shared';

// API-specific types
export interface RequestWithUser {
  user?: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
  };
}
