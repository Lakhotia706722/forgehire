import { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";

export async function notificationsRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.get(
    "/notifications",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request as any).user.userId;

      // Notification persistence is not yet in Prisma schema — return empty list
      void userId;

      return reply.send(
        successResponse([] as {
          id: string;
          type: string;
          title: string;
          body: string;
          read: boolean;
          createdAt: string;
          href: string | null;
        }[]),
      );
    },
  );
}
