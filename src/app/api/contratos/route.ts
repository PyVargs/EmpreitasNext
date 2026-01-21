import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/contratos - Listar contratos
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

    const contratos = await prisma.contrato.findMany({
      include: {
        condominio: {
          select: { id: true, nome: true },
        },
        parcelas: {
          select: { 
            id: true, 
            numeroParcela: true, 
            valorParcela: true,
            dataVencimento: true, 
            status: true,
            dataPagamento: true,
            valorPago: true,
          },
          orderBy: { numeroParcela: 'asc' },
        },
        medicoesObra: {
          select: {
            id: true,
            percentualExecutado: true,
            valorMedicao: true,
            valorPago: true,
            statusPagamento: true,
          },
        },
      },
      orderBy: { dataInicio: 'desc' },
    })

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const contratosFormatados = contratos.map((c: any) => {
      // Parcelas
      const parcelasPagas = c.parcelas.filter((p: any) => p.status === 'pago' || p.dataPagamento).length
      const parcelasPendentes = c.parcelas.filter((p: any) => !p.dataPagamento && p.status !== 'pago').length
      const parcelasVencidas = c.parcelas.filter((p: any) => {
        if (p.dataPagamento || p.status === 'pago') return false
        const vencimento = new Date(p.dataVencimento)
        vencimento.setHours(0, 0, 0, 0)
        return vencimento < hoje
      }).length

      // Valor pago via parcelas
      const valorPagoParcelas = c.parcelas
        .filter((p: any) => p.status === 'pago' || p.dataPagamento)
        .reduce((acc: number, p: any) => acc + (p.valorPago || p.valorParcela), 0)

      // Valor pago via medições
      const valorPagoMedicoes = c.medicoesObra
        .filter((m: any) => m.statusPagamento === 'pago')
        .reduce((acc: number, m: any) => acc + (m.valorPago || m.valorMedicao || 0), 0)

      // Percentual obra executada (para contratos por medição)
      const percentualObraExecutada = c.medicoesObra.length > 0
        ? c.medicoesObra.reduce((max: number, m: any) => Math.max(max, m.percentualExecutado || 0), 0)
        : 0

      const valorTotal = c.valorTotal || 0
      const entradaObra = c.entradaObra || 0
      const valorPago = valorPagoParcelas + valorPagoMedicoes + entradaObra
      const valorPendente = Math.max(0, valorTotal - valorPago)
      const percentualPago = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0

      return {
        id: c.id.toString(),
        condominio_id: c.condominioId?.toString(),
        nome_servico: c.nomeServico,
        valor_total: valorTotal,
        valor_original: c.valorOriginal || valorTotal,
        entrada_obra: entradaObra,
        area_total: c.areaTotal,
        tipo_pagamento: c.tipoPagamento || 'parcelas',
        data_inicio: c.dataInicio,
        data_fim: c.dataFim,
        status: c.status || 'ativo',
        observacoes: c.observacoes,
        valor_pago: valorPago,
        valor_pendente: valorPendente,
        parcelas_pagas: parcelasPagas,
        parcelas_pendentes: parcelasPendentes,
        parcelas_vencidas: parcelasVencidas,
        percentual_pago: percentualPago,
        percentual_obra_executada: percentualObraExecutada,
        total_parcelas: c.parcelas.length,
        total_medicoes: c.medicoesObra.length,
        created_at: c.dataCadastro,
        condominio: c.condominio ? {
          id: c.condominio.id.toString(),
          nome: c.condominio.nome,
          cnpj: '',
          endereco: '',
          sindico: '',
          ativo: true,
        } : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: contratosFormatados,
    })
  } catch (error) {
    console.error('Erro ao buscar contratos:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}
