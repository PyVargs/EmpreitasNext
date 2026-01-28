import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/contas-pagar - Listar contas a pagar
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const contas = await prisma.contaPagar.findMany({
      include: {
        fornecedor: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const contasFormatadas = contas.map((c: any) => {
      // Determinar status baseado na data de vencimento e pagamento
      let status = c.status || 'Pendente'
      
      if (c.dataPagamento) {
        status = 'Pago'
      } else {
        const vencimento = new Date(c.dataVencimento)
        vencimento.setHours(0, 0, 0, 0)
        if (vencimento < hoje) {
          status = 'Atrasado'
        } else {
          status = 'Pendente'
        }
      }

      return {
        id: c.id.toString(),
        descricao: c.descricao,
        valor: c.valor,
        data_vencimento: c.dataVencimento,
        data_pagamento: c.dataPagamento,
        status,
        categoria: c.categoria || 'Outros',
        fornecedor_id: c.fornecedorId?.toString(),
        observacoes: c.observacoes,
        observacoes_pagamento: c.observacoes_pagamento,
        nota_fiscal: c.notaFiscal,
        numero_nota: c.numeroNota,
        serie_nota: c.serie_nota,
        chave_nfe: c.chaveNfe,
        metodo_pagamento: c.metodoPagamento,
        conta_bancaria: c.contaBancaria,
        data_emissao_nota: c.data_emissao_nota,
        natureza_operacao: c.natureza_operacao,
        valor_produtos: c.valor_produtos,
        valor_servicos: c.valor_servicos,
        valor_frete: c.valor_frete,
        valor_desconto: c.valor_desconto,
        valor_impostos: c.valor_impostos,
        created_at: c.dataCriacao,
        fornecedor: c.fornecedor ? {
          id: c.fornecedor.id.toString(),
          nome: c.fornecedor.nome,
          ativo: true,
        } : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: contasFormatadas,
    })
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/contas-pagar - Criar nova conta a pagar
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const data = await req.json()

    const novaConta = await prisma.contaPagar.create({
      data: {
        descricao: data.descricao,
        valor: data.valor,
        dataVencimento: new Date(data.data_vencimento),
        status: 'pendente',
        categoria: data.categoria,
        fornecedorId: data.fornecedor_id ? parseInt(data.fornecedor_id) : null,
        observacoes: data.observacoes,
        numeroNota: data.numero_nota,
        metodoPagamento: data.metodo_pagamento,
        contaBancaria: data.conta_bancaria,
        dataCriacao: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: novaConta.id.toString(),
        ...data,
      },
    })
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar conta' })
  }
}
