import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await (request as { jwtVerify: () => Promise<void> }).jwtVerify();
    // The JWT payload is now available as request.user
  } catch (err) {
    void reply.status(401).send({
      error: 'Unauthorized',
      message: 'Access token is invalid or missing',
    });
    throw err;
  }
}

export type AuthenticatedRequest = FastifyRequest & {
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    roleId: string;
  };
};
