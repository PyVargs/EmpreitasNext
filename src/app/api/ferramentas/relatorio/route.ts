import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/ferramentas/relatorio - Dados completos para relatório de ferramentas
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

    // Buscar todas as ferramentas
    const ferramentas = await prisma.ferramenta.findMany({
      orderBy: [
        { localizacaoAtual: 'asc' },
        { nome: 'asc' },
      ],
    })

    // Estatísticas por localização
    const porLocalizacao = await prisma.ferramenta.groupBy({
      by: ['localizacaoAtual'],
      _count: { id: true },
    })

    // Estatísticas por categoria
    const porCategoria = await prisma.ferramenta.groupBy({
      by: ['categoria'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // Contagens específicas
    const total = ferramentas.length
    const emprestadas = ferramentas.filter(f => f.localizacaoAtual === 'FUNCIONARIO').length
    const noCD = ferramentas.filter(f => f.localizacaoAtual === 'CD').length
    const emManutencao = ferramentas.filter(f => f.localizacaoAtual === 'MANUTENCAO').length

    return NextResponse.json({
      success: true,
      data: {
        geradoEm: new Date().toISOString(),
        estatisticas: {
          total,
          por_localizacao: porLocalizacao.map(p => ({
            localizacao: p.localizacaoAtual || 'Não definida',
            quantidade: p._count.id,
          })),
          por_categoria: porCategoria.map(p => ({
            categoria: p.categoria || 'Sem categoria',
            quantidade: p._count.id,
          })),
          emprestadas,
          no_cd: noCD,
          em_manutencao: emManutencao,
        },
        ferramentas: ferramentas.map(f => ({
          id: f.id,
          codigo: f.codigo,
          nome: f.nome,
          descricao: f.descricao,
          categoria: f.categoria,
          tipo: f.tipo,
          marca: f.marca,
          localizacaoAtual: f.localizacaoAtual,
          funcionarioAtual: f.funcionarioAtual,
          obraAtual: f.obraAtual,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar dados do relatório:', error)
    return NextResponse.json({ success: false, error: 'Erro ao gerar relatório' })
  }
}
