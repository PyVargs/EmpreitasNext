import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/retiradas/[id] - Buscar uma retirada específica com histórico
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const retirada = await prisma.retirada.findUnique({
      where: { id: parseInt(id) },
      include: {
        funcionario: {
          select: { id: true, nome: true, telefone: true },
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
          include: {
            usuarios: {
              select: { id: true, nome: true },
            },
          },
          orderBy: { data_alteracao: 'desc' },
        },
      },
    })

    if (!retirada) {
      return NextResponse.json({ success: false, error: 'Retirada não encontrada' }, { status: 404 })
    }

    const retiradaFormatada = {
      id: retirada.id.toString(),
      valor: retirada.valor,
      data: retirada.data,
      descricao: retirada.descricao,
      funcionario_id: retirada.funcionarioId.toString(),
      empreitada_id: retirada.empreitadaId.toString(),
      funcionario: retirada.funcionario ? {
        id: retirada.funcionario.id.toString(),
        nome: retirada.funcionario.nome,
        telefone: retirada.funcionario.telefone,
      } : null,
      empreitada: retirada.empreitada ? {
        id: retirada.empreitada.id.toString(),
        nome: retirada.empreitada.nome,
        valor_total: retirada.empreitada.valorTotal,
        condominio: retirada.empreitada.condominio ? {
          id: retirada.empreitada.condominio.id.toString(),
          nome: retirada.empreitada.condominio.nome,
        } : null,
      } : null,
      historico: retirada.historico_retiradas.map((h: any) => ({
        id: h.id.toString(),
        campo_alterado: h.campo_alterado,
        valor_anterior: h.valor_anterior,
        valor_novo: h.valor_novo,
        motivo: h.motivo,
        data_alteracao: h.data_alteracao,
        ip_usuario: h.ip_usuario,
        usuario: h.usuarios ? {
          id: h.usuarios.id.toString(),
          nome: h.usuarios.nome,
        } : null,
      })),
    }

    return NextResponse.json({
      success: true,
      data: retiradaFormatada,
    })
  } catch (error) {
    console.error('Erro ao buscar retirada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// PUT /api/retiradas/[id] - Atualizar retirada (com registro de histórico)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const data = await req.json()

    // Buscar retirada atual para comparar
    const retiradaAtual = await prisma.retirada.findUnique({
      where: { id: parseInt(id) },
    })

    if (!retiradaAtual) {
      return NextResponse.json({ success: false, error: 'Retirada não encontrada' }, { status: 404 })
    }

    // Atualizar retirada
    const retiradaAtualizada = await prisma.retirada.update({
      where: { id: parseInt(id) },
      data: {
        valor: data.valor !== undefined ? data.valor : retiradaAtual.valor,
        data: data.data ? new Date(data.data) : retiradaAtual.data,
        descricao: data.descricao !== undefined ? data.descricao : retiradaAtual.descricao,
      },
    })

    // Registrar histórico de alterações
    const historicoEntries = []

    if (data.valor !== undefined && data.valor !== retiradaAtual.valor) {
      historicoEntries.push({
        retirada_id: parseInt(id),
        campo_alterado: 'valor',
        valor_anterior: retiradaAtual.valor.toString(),
        valor_novo: data.valor.toString(),
        motivo: data.motivo || 'Atualização de valor',
        data_alteracao: new Date(),
      })
    }

    if (data.data && new Date(data.data).getTime() !== retiradaAtual.data.getTime()) {
      historicoEntries.push({
        retirada_id: parseInt(id),
        campo_alterado: 'data',
        valor_anterior: retiradaAtual.data.toISOString(),
        valor_novo: new Date(data.data).toISOString(),
        motivo: data.motivo || 'Atualização de data',
        data_alteracao: new Date(),
      })
    }

    if (data.descricao !== undefined && data.descricao !== retiradaAtual.descricao) {
      historicoEntries.push({
        retirada_id: parseInt(id),
        campo_alterado: 'descricao',
        valor_anterior: retiradaAtual.descricao || '',
        valor_novo: data.descricao || '',
        motivo: data.motivo || 'Atualização de descrição',
        data_alteracao: new Date(),
      })
    }

    if (historicoEntries.length > 0) {
      await prisma.historico_retiradas.createMany({
        data: historicoEntries,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: retiradaAtualizada.id.toString(),
        valor: retiradaAtualizada.valor,
        data: retiradaAtualizada.data,
        descricao: retiradaAtualizada.descricao,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar retirada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar retirada' })
  }
}

// DELETE /api/retiradas/[id] - Excluir retirada
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Excluir histórico primeiro (devido à foreign key)
    await prisma.historico_retiradas.deleteMany({
      where: { retirada_id: parseInt(id) },
    })

    // Excluir retirada
    await prisma.retirada.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: 'Retirada excluída com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir retirada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir retirada' })
  }
}
