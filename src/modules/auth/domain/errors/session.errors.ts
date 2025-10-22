import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { DomainBaseError } from '@/shared/domain/errors';

/**
 * Error de dominio cuando un refresh token es inválido.
 *
 * @public
 */
export class InvalidRefreshTokenError extends DomainBaseError {
  /**
   * Crea un error de refresh token inválido.
   *
   * @param message Mensaje descriptivo del error
   * @param options Opciones adicionales para GraphQL
   */
  constructor(message: string = 'Invalid refresh token', options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'INVALID_REFRESH_TOKEN',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando un refresh token ha expirado.
 *
 * @public
 */
export class ExpiredRefreshTokenError extends DomainBaseError {
  /**
   * Crea un error de refresh token expirado.
   *
   * @param message Mensaje descriptivo del error
   * @param options Opciones adicionales para GraphQL
   */
  constructor(message: string = 'Refresh token has expired', options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'EXPIRED_REFRESH_TOKEN',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando un refresh token ha sido revocado.
 *
 * Este error indica un posible intento de reuso de token, lo que puede
 * representar un riesgo de seguridad. Todas las sesiones del usuario
 * deben ser revocadas cuando esto ocurre.
 *
 * @public
 */
export class RevokedRefreshTokenError extends DomainBaseError {
  /**
   * Crea un error de refresh token revocado.
   *
   * @param message Mensaje descriptivo del error
   * @param options Opciones adicionales para GraphQL
   */
  constructor(
    message: string = 'Refresh token has been revoked. All sessions have been terminated for security reasons.',
    options?: GraphQLErrorOptions,
  ) {
    super(message, {
      ...options,
      extensions: {
        code: 'REVOKED_REFRESH_TOKEN',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando no se encuentra una sesión.
 *
 * @public
 */
export class SessionNotFoundError extends DomainBaseError {
  /**
   * Crea un error de sesión no encontrada.
   *
   * @param sessionId ID de la sesión que no se encontró
   * @param options Opciones adicionales para GraphQL
   */
  constructor(sessionId: string, options?: GraphQLErrorOptions) {
    super(`Session with id ${sessionId} not found`, {
      ...options,
      extensions: {
        code: 'SESSION_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        sessionId,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
