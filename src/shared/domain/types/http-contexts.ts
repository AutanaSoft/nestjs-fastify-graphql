import { UserEntity } from '@/modules/users/domain/entities';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Representa una solicitud HTTP autenticada que extiende FastifyRequest.
 * Incluye opcionalmente información del usuario autenticado.
 */
export type AuthenticatedRequest = FastifyRequest & { user?: UserEntity };

/**
 * Contexto HTTP que encapsula la solicitud autenticada y la respuesta de Fastify.
 * Utilizado en controladores REST y middleware HTTP.
 */
export interface FastifyContext {
  request: AuthenticatedRequest;
  reply: FastifyReply;
}

/**
 * Contexto GraphQL que encapsula la solicitud autenticada y la respuesta de Fastify.
 * Utilizado en resolvers GraphQL para acceder a la información de la solicitud HTTP subyacente.
 */
export interface GraphQLContext {
  req: AuthenticatedRequest;
  res: FastifyReply;
}
