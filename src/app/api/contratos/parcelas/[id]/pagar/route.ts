import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/contratos/parcelas/[id]/pagar - Registrar pagamento de parcela
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { valor_pago, data_pagamento, observacoes } = body

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se parcela existe
    const parcela = await prisma.parcela.findUnique({
      where: { id: parseInt(id) },
    })

    if (!parcela) {
      return NextResponse.json({ success: false, error: 'Parcela não encontrada' }, { status: 404 })
    }

    // Atualizar parcela
    const parcelaAtualizada = await prisma.parcela.update({
      where: { id: parseInt(id) },
      data: {
        status: 'pago',
        dataPagamento: data_pagamento ? new Date(data_pagamento) : new Date(),
        valorPago: valor_pago || parcela.valorParcela,
        observacoes: observacoes || parcela.observacoes,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Pagamento registrado com sucesso!',
      data: {
        id: parcelaAtualizada.id.toString(),
        valor_pago: parcelaAtualizada.valorPago,
        data_pagamento: parcelaAtualizada.dataPagamento,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    return NextResponse.json({ success: false, error: 'Erro ao registrar pagamento' })
  }
}
