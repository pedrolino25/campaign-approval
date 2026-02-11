
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

export const prisma: PrismaClient = global.prisma ?? createPrismaClient()

if (!global.prisma) {
  global.prisma = prisma
}
