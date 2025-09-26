import { HttpException } from '@nestjs/common';

type HttpExceptionResponse = string | { message?: unknown; [k: string]: unknown };

/**
 * Safely extract a human-friendly message from an HttpException response.
 */
export function pickHttpMessage(response: HttpExceptionResponse, fallback: string): string {
  if (typeof response === 'string') return response;
  const msg = response?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return fallback;
}

/**
 * Get the raw response object in a safe record form (for extensions).
 */
export function toExtensions(response: HttpExceptionResponse): Record<string, unknown> {
  return typeof response === 'object' && response !== null ? { ...response } : {};
}

/**
 * Narrow an unknown into HttpException if possible.
 */
export function asHttpException(err: unknown): HttpException | null {
  return err instanceof HttpException ? err : null;
}
