import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient();

let isConnected = false;

export async function checkDbConnection(): Promise<boolean> {
  if (isConnected) return true;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    return true;
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      console.error('[DATABASE ERROR] Failed to connect to PostgreSQL database in production environment.', error);
    }
    return false;
  }
}
