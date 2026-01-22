import { NextResponse } from 'next/server'
import { requireAuth, validateId, logAuditAction } from '@/lib/auth-utils'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { createRetiradaSchema, validateRequest } from '@/lib/validations'

// GET /api/retiradas - Listar todas as retiradas
export async function GET(req: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimitMiddleware(req)
    if (rateLimitResponse) return rateLimitResponse

    // Autenticação
    const { authorized, response, session } = await requireAuth()
    if (!authorized) return response!

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const { searchParams } = new URL(req.url)
    const funcionarioIdParam = searchParams.get('funcionario_id')
    const empreitadaIdParam = searchParams.get('empreitada_id')

    // Validar IDs
    const where: any = {}
    if (funcionarioIdParam) {
      const funcionarioId = validateId(funcionarioIdParam)
      if (!funcionarioId) {
        return NextResponse.json({ success: false, error: 'ID de funcionário inválido' }, { status: 400 })
      }
      where.funcionarioId = funcionarioId
    }
    if (empreitadaIdParam) {
      const empreitadaId = validateId(empreitadaIdParam)
      if (!empreitadaId) {
        return NextResponse.json({ success: false, error: 'ID de empreitada inválido' }, { status: 400 })
      }
      where.empreitadaId = empreitadaId
    }

    const retiradas = await prisma.retirada.findMany({
      where,
      include: {
        funcionario: {
          select: { id: true, nome: true },
        },
        empreitada: {
          select: { 
            id: true, 
            nome: true,
            valorTotal: true,
            condominio: {
              select: { id: true, nome: true },
            },
          },
        },
        historico_retiradas: {
          select: {
            id: true,
            campo_alterado: true,
            valor_anterior: true,
            valor_novo: true,
            motivo: true,
            data_alteracao: true,
          },
          orderBy: { data_alteracao: 'desc' },
        },
      },
      orderBy: { data: 'desc' },
    })

    const retiradasFormatadas = retiradas.map((r: any) => ({
      id: r.id.toString(),
      valor: r.valor,
      data: r.data,
      descricao: r.descricao,
      funcionario_id: r.funcionarioId.toString(),
      empreitada_id: r.empreitadaId.toString(),
      funcionario: r.funcionario ? {
        id: r.funcionario.id.toString(),
        nome: r.funcionario.nome,
      } : null,
      empreitada: r.empreitada ? {
        id: r.empreitada.id.toString(),
        nome: r.empreitada.nome,
        valor_total: r.empreitada.valorTotal,
        condominio: r.empreitada.condominio ? {
          id: r.empreitada.condominio.id.toString(),
          nome: r.empreitada.condominio.nome,
        } : null,
      } : null,
      historico: r.historico_retiradas.map((h: any) => ({
        id: h.id.toString(),
        campo_alterado: h.campo_alterado,
        valor_anterior: h.valor_anterior,
        valor_novo: h.valor_novo,
        motivo: h.motivo,
        data_alteracao: h.data_alteracao,
      })),
      tem_historico: r.historico_retiradas.length > 0,
    }))

    return NextResponse.json({
      success: true,
      data: retiradasFormatadas,
    })
  } catch (error) {
    console.error('Erro ao buscar retiradas:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/retiradas - Criar nova retirada
export async function POST(req: Request) {
  try {
    // Rate limiting estrito para criação
    const rateLimitResponse = rateLimitMiddleware(req)
    if (rateLimitResponse) return rateLimitResponse

    // Autenticação
    const { authorized, response, session } = await requireAuth()
    if (!authorized) return response!

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const rawData = await req.json()
    
    // Aceitar ambos os formatos de nome (camelCase e snake_case)
    const normalizedData = {
      funcionarioId: rawData.funcionarioId || rawData.funcionario_id,
      empreitadaId: rawData.empreitadaId || rawData.empreitada_id,
      valor: rawData.valor,
      data: rawData.data,
      descricao: rawData.descricao,
    }

    // Validação com Zod
    const validation = validateRequest(createRetiradaSchema, normalizedData)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 })
    }

    const data = validation.data

    // Verificar se funcionário existe
    const funcionario = await prisma.funcionario.findUnique({
      where: { id: data.funcionarioId },
    })
    if (!funcionario) {
      return NextResponse.json({ success: false, error: 'Funcionário não encontrado' }, { status: 404 })
    }

    // Verificar se empreitada existe e pertence ao funcionário
    const empreitada = await prisma.empreitada.findUnique({
      where: { id: data.empreitadaId },
    })
    if (!empreitada) {
      return NextResponse.json({ success: false, error: 'Empreitada não encontrada' }, { status: 404 })
    }
    if (empreitada.funcionarioId !== data.funcionarioId) {
      return NextResponse.json({ success: false, error: 'Empreitada não pertence ao funcionário' }, { status: 400 })
    }

    const novaRetirada = await prisma.retirada.create({
      data: {
        valor: data.valor,
        data: data.data ? new Date(data.data) : new Date(),
        descricao: data.descricao || null,
        funcionarioId: data.funcionarioId,
        empreitadaId: data.empreitadaId,
      },
    })

    // Log de auditoria
    await logAuditAction(prisma, 'CREATE_RETIRADA', {
      userId: session?.user?.id ? parseInt(session.user.id) : undefined,
      entityType: 'retirada',
      entityId: novaRetirada.id,
      newValue: { valor: data.valor, funcionarioId: data.funcionarioId, empreitadaId: data.empreitadaId },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: novaRetirada.id.toString(),
        valor: novaRetirada.valor,
        data: novaRetirada.data,
        descricao: novaRetirada.descricao,
        funcionarioId: novaRetirada.funcionarioId.toString(),
        empreitadaId: novaRetirada.empreitadaId.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao criar retirada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar retirada' }, { status: 500 })
  }
}
