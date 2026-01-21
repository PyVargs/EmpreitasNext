import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/empreitadas - Listar empreitadas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const concluida = searchParams.get('concluida')

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const where: { concluida?: boolean } = {}
    if (concluida !== null) {
      where.concluida = concluida === 'true'
    }

    const empreitadas = await prisma.empreitada.findMany({
      where,
      include: {
        funcionario: {
          select: { id: true, nome: true },
        },
        condominio: {
          select: { id: true, nome: true },
        },
        retiradas: {
          select: { valor: true, data: true },
        },
      },
      orderBy: { data: 'desc' },
    })

    const empreitadasFormatadas = empreitadas.map((e: any) => {
      const totalRetirado = e.retiradas.reduce((acc: number, r: any) => acc + r.valor, 0)
      return {
        id: e.id.toString(),
        nome: e.nome,
        descricao: e.descricao,
        valor_total: e.valorTotal,
        total_retirado: totalRetirado,
        saldo: e.valorTotal - totalRetirado,
        concluida: e.concluida || false,
        data: e.data,
        data_conclusao: e.dataConclusao,
        funcionario: e.funcionario ? {
          id: e.funcionario.id.toString(),
          nome: e.funcionario.nome,
        } : null,
        condominio: e.condominio ? {
          id: e.condominio.id.toString(),
          nome: e.condominio.nome,
        } : null,
        total_retiradas: e.retiradas.length,
      }
    })

    return NextResponse.json({
      success: true,
      data: empreitadasFormatadas,
    })
  } catch (error) {
    console.error('Erro ao buscar empreitadas:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/empreitadas - Criar empreitada
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, descricao, valor_total, funcionario_id, condominio_id } = body

    if (!nome || !valor_total || !funcionario_id || !condominio_id) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const empreitada = await prisma.empreitada.create({
      data: {
        nome,
        descricao,
        valorTotal: parseFloat(valor_total),
        funcionarioId: parseInt(funcionario_id),
        condominioId: parseInt(condominio_id),
        data: new Date(),
        concluida: false,
      },
      include: {
        funcionario: { select: { id: true, nome: true } },
        condominio: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: empreitada.id.toString(),
        nome: empreitada.nome,
        descricao: empreitada.descricao,
        valor_total: empreitada.valorTotal,
        total_retirado: 0,
        saldo: empreitada.valorTotal,
        concluida: false,
        data: empreitada.data,
        funcionario: empreitada.funcionario,
        condominio: empreitada.condominio,
      },
    })
  } catch (error) {
    console.error('Erro ao criar empreitada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar empreitada' })
  }
}
