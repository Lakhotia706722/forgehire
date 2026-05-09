import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, errorResponse } from '@neuronhire/shared';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error (exclude sensitive data)
  const logError = {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: request.url,
    method: request.method
  };
  console.error('Error:', logError);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    reply.status(400).send(
      errorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      )
    );
    return;
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(
      errorResponse(error.code, error.message, error.details)
    );
    return;
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    reply.status(error.statusCode || 500).send(
      errorResponse(
        error.code || 'INTERNAL_ERROR',
        error.message || 'An unexpected error occurred'
      )
    );
    return;
  }

  // Default error response
  reply.status(500).send(
    errorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred'
    )
  );
}
