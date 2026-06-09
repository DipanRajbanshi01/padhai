import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. Next.js dev hot-reload would otherwise spawn many
 * connections, so we cache the instance on globalThis outside production.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
