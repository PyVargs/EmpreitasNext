import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/contas-pagar/[id] - Buscar conta específica
export async function GET(
  request: Request,
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

    // Buscar conta com fornecedor e itens (itens podem não existir se tabela não foi criada)
    let conta: any = await prisma.contaPagar.findUnique({
      where: { id: parseInt(id) },
      include: {
        fornecedor: {
          select: { id: true, nome: true },
        },
      },
    })

    if (!conta) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 })
    }

    // Tentar buscar itens separadamente (tabela pode não existir ainda)
    let itens: any[] = []
    try {
      itens = await prisma.$queryRaw`
        SELECT id, numero_item as "numeroItem", codigo_produto as "codigoProduto", 
               descricao, ncm, cfop, unidade, quantidade, 
               valor_unitario as "valorUnitario", valor_total as "valorTotal", 
               valor_desconto as "valorDesconto"
        FROM itens_conta_pagar 
        WHERE conta_pagar_id = ${parseInt(id)}
        ORDER BY numero_item ASC
      `
      console.log(`[GET Conta ${id}] Itens encontrados: ${itens.length}`)
    } catch (err) {
      console.log('[GET Conta] Erro ao buscar itens:', err)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conta.id.toString(),
        descricao: conta.descricao,
        valor: conta.valor,
        data_vencimento: conta.dataVencimento,
        data_pagamento: conta.dataPagamento,
        status: conta.status,
        categoria: conta.categoria,
        fornecedor_id: conta.fornecedorId?.toString(),
        observacoes: conta.observacoes,
        observacoes_pagamento: conta.observacoes_pagamento,
        numero_nota: conta.numeroNota,
        serie_nota: conta.serie_nota,
        chave_nfe: conta.chaveNfe,
        metodo_pagamento: conta.metodoPagamento,
        conta_bancaria: conta.contaBancaria,
        data_emissao_nota: conta.data_emissao_nota,
        natureza_operacao: conta.natureza_operacao,
        // Valores da nota fiscal
        valor_produtos: conta.valor_produtos,
        valor_servicos: conta.valor_servicos,
        valor_frete: conta.valor_frete,
        valor_desconto: conta.valor_desconto,
        valor_impostos: conta.valor_impostos,
        fornecedor: conta.fornecedor ? {
          id: conta.fornecedor.id.toString(),
          nome: conta.fornecedor.nome,
        } : null,
        itens: itens.map((item: {
          id: number
          numeroItem: number | null
          codigoProduto: string | null
          descricao: string
          ncm: string | null
          cfop: string | null
          unidade: string | null
          quantidade: number
          valorUnitario: number
          valorTotal: number
          valorDesconto: number | null
        }) => ({
          id: item.id.toString(),
          numero_item: item.numeroItem,
          codigo_produto: item.codigoProduto,
          descricao: item.descricao,
          ncm: item.ncm,
          cfop: item.cfop,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          valor_total: item.valorTotal,
          valor_desconto: item.valorDesconto,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar conta:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// PUT /api/contas-pagar/[id] - Atualizar conta
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verifica se a conta existe
    const contaExistente = await prisma.contaPagar.findUnique({
      where: { id: parseInt(id) },
    })

    if (!contaExistente) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      dataAtualizacao: new Date(),
    }

    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.valor !== undefined) updateData.valor = parseFloat(data.valor)
    if (data.data_vencimento !== undefined) updateData.dataVencimento = new Date(data.data_vencimento)
    if (data.data_pagamento !== undefined) updateData.dataPagamento = data.data_pagamento ? new Date(data.data_pagamento) : null
    if (data.status !== undefined) updateData.status = data.status
    if (data.categoria !== undefined) updateData.categoria = data.categoria || null
    if (data.fornecedor_id !== undefined) updateData.fornecedorId = data.fornecedor_id ? parseInt(data.fornecedor_id) : null
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null
    if (data.numero_nota !== undefined) updateData.numeroNota = data.numero_nota || null
    if (data.metodo_pagamento !== undefined) updateData.metodoPagamento = data.metodo_pagamento || null
    if (data.conta_bancaria !== undefined) updateData.contaBancaria = data.conta_bancaria || null

    const contaAtualizada = await prisma.contaPagar.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: contaAtualizada.id.toString(),
      },
      message: 'Conta atualizada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar conta' })
  }
}

// DELETE /api/contas-pagar/[id] - Excluir conta
export async function DELETE(
  request: Request,
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

    // Verifica se a conta existe
    const conta = await prisma.contaPagar.findUnique({
      where: { id: parseInt(id) },
    })

    if (!conta) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 })
    }

    await prisma.contaPagar.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: 'Conta excluída com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir conta' })
  }
}
