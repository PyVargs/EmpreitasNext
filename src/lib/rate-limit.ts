import { NextResponse } from 'next/server'

// Store para rate limiting (em produção, usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number      // Janela de tempo em ms
  maxRequests: number   // Máximo de requests na janela
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minuto
  maxRequests: 100,     // 100 requests por minuto
}

const strictConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minuto
  maxRequests: 10,      // 10 requests por minuto (para ações sensíveis)
}

/**
 * Rate Limiter simples para APIs
 * Em produção, substituir por Redis ou similar
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier
  
  const existing = rateLimitStore.get(key)
  
  // Se não existe ou expirou, criar novo
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }
  
  // Se existe e não expirou
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    }
  }
  
  // Incrementar contador
  existing.count++
  rateLimitStore.set(key, existing)
  
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetIn: existing.resetTime - now,
  }
}

/**
 * Middleware de rate limiting para rotas de API
 */
export function rateLimitMiddleware(
  request: Request,
  config: RateLimitConfig = defaultConfig
) {
  // Extrair IP do request
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const result = rateLimit(ip, config)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil(result.resetIn / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + result.resetIn),
        },
      }
    )
  }
  
  return null // Permitido
}

/**
 * Rate limit estrito para ações sensíveis (login, delete, etc)
 */
export function strictRateLimit(request: Request) {
  return rateLimitMiddleware(request, strictConfig)
}

/**
 * Limpa entradas expiradas do store (executar periodicamente)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Limpar store a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
