import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

/**
 * Verifica se o usuário está autenticado
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      ),
      session: null,
    }
  }

  return {
    authorized: true,
    response: null,
    session,
  }
}

/**
 * Verifica se o usuário é admin
 */
export async function requireAdmin() {
  const { authorized, response, session } = await requireAuth()

  if (!authorized) {
    return { authorized: false, response, session: null }
  }

  if (!session?.user?.admin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Acesso negado. Requer privilégios de administrador.' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { authorized: true, response: null, session }
}

/**
 * Verifica senha de administrador para ações críticas
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Senha hardcoded por enquanto - idealmente deve vir do banco
  const ADMIN_PASSWORD = process.env.ADMIN_ACTION_PASSWORD || 'vbs151481'
  return password === ADMIN_PASSWORD
}

/**
 * Sanitiza entrada de texto para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Valida e sanitiza ID numérico
 */
export function validateId(id: string | number): number | null {
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id
  
  if (isNaN(parsed) || parsed <= 0 || parsed > 2147483647) {
    return null
  }
  
  return parsed
}

/**
 * Valida valor monetário
 */
export function validateMoney(value: unknown): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (typeof num !== 'number' || isNaN(num)) {
    return null
  }
  
  // Máximo de 2 casas decimais e valor razoável
  if (num < 0 || num > 999999999.99) {
    return null
  }
  
  return Math.round(num * 100) / 100
}

/**
 * Log de auditoria para ações críticas
 */
export async function logAuditAction(
  prisma: any,
  action: string,
  details: {
    userId?: number
    entityType: string
    entityId: number | string
    oldValue?: unknown
    newValue?: unknown
    ipAddress?: string
  }
) {
  try {
    await prisma.logs.create({
      data: {
        nivel: 'INFO',
        mensagem: `${action}: ${details.entityType} #${details.entityId}`,
        contexto: JSON.stringify({
          action,
          entityType: details.entityType,
          entityId: details.entityId,
          oldValue: details.oldValue,
          newValue: details.newValue,
          timestamp: new Date().toISOString(),
        }),
        usuario_id: details.userId || null,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
  }
}
