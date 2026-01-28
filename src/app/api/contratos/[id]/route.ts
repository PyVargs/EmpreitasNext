import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/contratos/[id] - Buscar contrato específico
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

    const contrato = await prisma.contrato.findUnique({
      where: { id: parseInt(id) },
      include: {
        condominio: true,
        parcelas: {
          orderBy: { numeroParcela: 'asc' },
        },
        medicoesObra: {
          orderBy: { dataMedicao: 'desc' },
        },
      },
    })

    if (!contrato) {
      return NextResponse.json({ success: false, error: 'Contrato não encontrado' }, { status: 404 })
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Formatar parcelas
    const parcelasFormatadas = contrato.parcelas.map((p: any) => {
      const vencimento = new Date(p.dataVencimento)
      vencimento.setHours(0, 0, 0, 0)
      const estaVencida = !p.dataPagamento && p.status !== 'pago' && vencimento < hoje

      return {
        id: p.id.toString(),
        numero_parcela: p.numeroParcela,
        valor_parcela: p.valorParcela,
        valor_original: p.valorOriginal,
        data_vencimento: p.dataVencimento,
        status: p.dataPagamento ? 'pago' : (estaVencida ? 'vencida' : (p.status || 'pendente')),
        data_pagamento: p.dataPagamento,
        valor_pago: p.valorPago,
        observacoes: p.observacoes,
      }
    })

    // Formatar medições
    const medicoesFormatadas = contrato.medicoesObra.map((m: any) => ({
      id: m.id.toString(),
      data_medicao: m.dataMedicao,
      area_executada: m.areaExecutada,
      percentual_executado: m.percentualExecutado,
      valor_medicao: m.valorMedicao,
      valor_pago: m.valorPago,
      status_pagamento: m.statusPagamento || 'pendente',
      observacoes: m.observacoes,
    }))

    // Calcular totais
    const parcelasPagas = parcelasFormatadas.filter((p: any) => p.status === 'pago').length
    const parcelasPendentes = parcelasFormatadas.filter((p: any) => p.status !== 'pago').length
    const parcelasVencidas = parcelasFormatadas.filter((p: any) => p.status === 'vencida').length

    const valorPagoParcelas = parcelasFormatadas
      .filter((p: any) => p.status === 'pago')
      .reduce((acc: number, p: any) => acc + (p.valor_pago || p.valor_parcela), 0)

    const valorPagoMedicoes = medicoesFormatadas
      .filter((m: any) => m.status_pagamento === 'pago')
      .reduce((acc: number, m: any) => acc + (m.valor_pago || m.valor_medicao || 0), 0)

    const percentualObraExecutada = medicoesFormatadas.length > 0
      ? medicoesFormatadas.reduce((max: number, m: any) => Math.max(max, m.percentual_executado || 0), 0)
      : 0

    const valorTotal = contrato.valorTotal || 0
    const entradaObra = contrato.entradaObra || 0
    const valorPago = valorPagoParcelas + valorPagoMedicoes + entradaObra
    const valorPendente = Math.max(0, valorTotal - valorPago)
    const percentualPago = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        id: contrato.id.toString(),
        condominio_id: contrato.condominioId?.toString(),
        nome_servico: contrato.nomeServico,
        valor_total: valorTotal,
        valor_original: contrato.valorOriginal || valorTotal,
        entrada_obra: entradaObra,
        area_total: contrato.areaTotal,
        tipo_pagamento: contrato.tipoPagamento || 'parcelas',
        data_inicio: contrato.dataInicio,
        data_fim: contrato.dataFim,
        status: contrato.status || 'ativo',
        observacoes: contrato.observacoes,
        valor_pago: valorPago,
        valor_pendente: valorPendente,
        parcelas_pagas: parcelasPagas,
        parcelas_pendentes: parcelasPendentes,
        parcelas_vencidas: parcelasVencidas,
        percentual_pago: percentualPago,
        percentual_obra_executada: percentualObraExecutada,
        total_parcelas: parcelasFormatadas.length,
        total_medicoes: medicoesFormatadas.length,
        created_at: contrato.dataCadastro,
        condominio: contrato.condominio ? {
          id: contrato.condominio.id.toString(),
          nome: contrato.condominio.nome,
          cnpj: contrato.condominio.cnpj,
          endereco: contrato.condominio.endereco,
          sindico: contrato.condominio.sindico,
          telefone: contrato.condominio.telefone,
          email: contrato.condominio.email,
          ativo: contrato.condominio.ativo ?? true,
        } : null,
        parcelas: parcelasFormatadas,
        medicoes: medicoesFormatadas,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar contrato:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}
