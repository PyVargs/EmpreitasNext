import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl || databaseUrl === 'postgresql://user:password@host:5432/database') {
    console.error('⚠️ DATABASE_URL não configurada ou usando valor padrão')
    throw new Error(
      '❌ DATABASE_URL não está configurada corretamente!\n\n' +
      'Edite o arquivo .env na raiz do projeto empreitas-app:\n\n' +
      'DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@SEU_HOST:5432/SEU_BANCO?sslmode=require"'
    )
  }

  return databaseUrl
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl()
  
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })
  
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Lazy initialization - só cria quando for usado
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Para compatibilidade com imports existentes
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getPrisma(), prop)
  }
})

export default prisma
