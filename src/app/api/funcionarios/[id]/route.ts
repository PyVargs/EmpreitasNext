import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/funcionarios/[id] - Buscar funcionário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const funcionarioId = parseInt(id)

    const funcionario = await prisma.funcionario.findUnique({
      where: { id: funcionarioId },
      include: {
        empreitadas: {
          include: {
            condominio: true,
            retiradas: true,
          },
          orderBy: { data: 'desc' },
        },
        retiradas: {
          include: {
            empreitada: true,
          },
          orderBy: { data: 'desc' },
        },
        ferramentas: {
          where: {
            localizacaoAtual: 'FUNCIONARIO',
          },
        },
      },
    })

    if (!funcionario) {
      return NextResponse.json(
        { success: false, error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular totais
    let totalEmpreitadasAtivas = 0
    let totalRetiradoAtivas = 0
    let saldoNegativoConcluidas = 0

    funcionario.empreitadas.forEach((e: any) => {
      const valorRetirado = e.retiradas?.reduce((sum: number, r: any) => sum + r.valor, 0) || 0
      const saldoEmpreitada = e.valorTotal - valorRetirado

      if (!e.concluida) {
        // Empreitada ativa - soma normal
        totalEmpreitadasAtivas += e.valorTotal
        totalRetiradoAtivas += valorRetirado
      } else {
        // Empreitada concluída - só considera se tiver saldo negativo (dívida)
        if (saldoEmpreitada < 0) {
          saldoNegativoConcluidas += saldoEmpreitada
        }
      }
    })

    // Saldo = (ativas) + saldos negativos de concluídas
    const saldoAtivas = totalEmpreitadasAtivas - totalRetiradoAtivas
    const saldoTotal = saldoAtivas + saldoNegativoConcluidas

    // Verificar se funcionário está ativo (tem pelo menos uma empreitada ativa)
    const empreitadasAtivas = funcionario.empreitadas.filter((e) => !e.concluida)
    const estaAtivo = empreitadasAtivas.length > 0

    return NextResponse.json({
      success: true,
      data: {
        ...funcionario,
        ativo: estaAtivo,
        total_empreitadas: totalEmpreitadasAtivas,
        total_retirado: totalRetiradoAtivas,
        saldo: saldoTotal,
        saldo_negativo_concluidas: saldoNegativoConcluidas,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/funcionarios/[id] - Atualizar funcionário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const funcionarioId = parseInt(id)
    const body = await request.json()
    const { nome, telefone, cpf, rg, endereco } = body

    const funcionario = await prisma.funcionario.update({
      where: { id: funcionarioId },
      data: {
        nome,
        telefone,
        cpf,
        rg,
        endereco,
      },
    })

    return NextResponse.json({
      success: true,
      data: funcionario,
      message: 'Funcionário atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/funcionarios/[id] - Deletar funcionário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const funcionarioId = parseInt(id)

    // Verificar se tem empreitadas ativas
    const empreitadasAtivas = await prisma.empreitada.count({
      where: {
        funcionarioId,
        concluida: false,
      },
    })

    if (empreitadasAtivas > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível excluir funcionário com empreitadas ativas',
        },
        { status: 400 }
      )
    }

    await prisma.funcionario.delete({
      where: { id: funcionarioId },
    })

    return NextResponse.json({
      success: true,
      message: 'Funcionário excluído com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
