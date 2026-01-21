import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/empreitadas/[id] - Buscar empreitada específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Next.js 16: params é uma Promise
    const { id } = await params

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const empreitada = await prisma.empreitada.findUnique({
      where: { id: parseInt(id) },
      include: {
        funcionario: {
          select: { id: true, nome: true },
        },
        condominio: {
          select: { id: true, nome: true },
        },
        retiradas: {
          select: { id: true, valor: true, data: true, descricao: true },
          orderBy: { data: 'desc' },
        },
      },
    })

    if (!empreitada) {
      return NextResponse.json({ success: false, error: 'Empreitada não encontrada' }, { status: 404 })
    }

    const totalRetirado = empreitada.retiradas.reduce((acc: number, r: { valor: number }) => acc + r.valor, 0)

    return NextResponse.json({
      success: true,
      data: {
        id: empreitada.id.toString(),
        nome: empreitada.nome,
        descricao: empreitada.descricao,
        valor_total: empreitada.valorTotal,
        total_retirado: totalRetirado,
        saldo: empreitada.valorTotal - totalRetirado,
        concluida: empreitada.concluida || false,
        data: empreitada.data,
        data_conclusao: empreitada.dataConclusao,
        funcionario: empreitada.funcionario,
        condominio: empreitada.condominio,
        retiradas: empreitada.retiradas.map((r: { id: number; valor: number; data: Date; descricao: string | null }) => ({
          id: r.id.toString(),
          valor: r.valor,
          data: r.data,
          descricao: r.descricao,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar empreitada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar empreitada' })
  }
}

// PUT /api/empreitadas/[id] - Atualizar empreitada
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Next.js 16: params é uma Promise
    const { id } = await params

    const body = await request.json()
    const { nome, valorTotal, descricao, concluida } = body

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se a empreitada existe
    const empreitadaExistente = await prisma.empreitada.findUnique({
      where: { id: parseInt(id) },
    })

    if (!empreitadaExistente) {
      return NextResponse.json({ success: false, error: 'Empreitada não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    
    if (nome !== undefined) {
      updateData.nome = nome
    }
    
    if (valorTotal !== undefined) {
      updateData.valorTotal = parseFloat(valorTotal)
    }
    
    if (descricao !== undefined) {
      updateData.descricao = descricao
    }
    
    if (concluida !== undefined) {
      updateData.concluida = concluida
      if (concluida) {
        updateData.dataConclusao = new Date()
      } else {
        updateData.dataConclusao = null
      }
    }

    const empreitada = await prisma.empreitada.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        funcionario: { select: { id: true, nome: true } },
        condominio: { select: { id: true, nome: true } },
        retiradas: { select: { valor: true } },
      },
    })

    const totalRetirado = empreitada.retiradas.reduce((acc: number, r: { valor: number }) => acc + r.valor, 0)

    return NextResponse.json({
      success: true,
      data: {
        id: empreitada.id.toString(),
        nome: empreitada.nome,
        descricao: empreitada.descricao,
        valor_total: empreitada.valorTotal,
        total_retirado: totalRetirado,
        saldo: empreitada.valorTotal - totalRetirado,
        concluida: empreitada.concluida || false,
        data: empreitada.data,
        data_conclusao: empreitada.dataConclusao,
        funcionario: empreitada.funcionario,
        condominio: empreitada.condominio,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar empreitada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar empreitada' })
  }
}

// DELETE /api/empreitadas/[id] - Excluir empreitada
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Next.js 16: params é uma Promise
    const { id } = await params

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se a empreitada existe
    const empreitadaExistente = await prisma.empreitada.findUnique({
      where: { id: parseInt(id) },
      include: { retiradas: true },
    })

    if (!empreitadaExistente) {
      return NextResponse.json({ success: false, error: 'Empreitada não encontrada' }, { status: 404 })
    }

    // Verificar se há retiradas vinculadas
    if (empreitadaExistente.retiradas.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não é possível excluir uma empreitada com retiradas vinculadas' 
      }, { status: 400 })
    }

    await prisma.empreitada.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true, message: 'Empreitada excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir empreitada:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir empreitada' })
  }
}
