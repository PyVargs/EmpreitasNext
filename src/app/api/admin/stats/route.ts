import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/stats - Estatísticas do sistema
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session.user?.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Buscar estatísticas
    const [
      totalUsuarios,
      usuariosAtivos,
      totalFuncionarios,
      totalCondominios,
      condominiosAtivos,
      totalEmpreitadas,
      empreitadasAtivas,
      totalFerramentas,
      totalContratos,
      totalRetiradas,
      valorTotalEmpreitadas,
      valorTotalRetiradas,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { ativo: true } }),
      prisma.funcionario.count(),
      prisma.condominio.count(),
      prisma.condominio.count({ where: { ativo: true } }),
      prisma.empreitada.count(),
      prisma.empreitada.count({ where: { concluida: false } }),
      prisma.ferramenta.count(),
      prisma.contrato.count(),
      prisma.retirada.count(),
      prisma.empreitada.aggregate({ _sum: { valorTotal: true } }),
      prisma.retirada.aggregate({ _sum: { valor: true } }),
    ])
    
    // Funcionários não têm campo ativo, então consideramos todos como ativos
    const funcionariosAtivos = totalFuncionarios

    // Buscar últimas atividades (histórico de empreitadas)
    const ultimasAtividades = await prisma.historicoEmpreitada.findMany({
      take: 10,
      orderBy: { dataAlteracao: 'desc' },
      include: {
        empreitada: { select: { nome: true } },
        usuario: { select: { nome: true } },
      },
    })

    // Ferramentas por localização
    const ferramentasPorLocalizacao = await prisma.ferramenta.groupBy({
      by: ['localizacaoAtual'],
      _count: { id: true },
    })

    // Empreitadas por mês (últimos 6 meses)
    const seisAtras = new Date()
    seisAtras.setMonth(seisAtras.getMonth() - 6)
    
    const empreitadasRecentes = await prisma.empreitada.findMany({
      where: { data: { gte: seisAtras } },
      select: { data: true, valorTotal: true },
    })

    const empreitadasPorMes: { [key: string]: { count: number, valor: number } } = {}
    empreitadasRecentes.forEach((emp: { data: Date | null, valorTotal: number }) => {
      if (emp.data) {
        const mes = new Date(emp.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        if (!empreitadasPorMes[mes]) {
          empreitadasPorMes[mes] = { count: 0, valor: 0 }
        }
        empreitadasPorMes[mes].count++
        empreitadasPorMes[mes].valor += emp.valorTotal || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          ativos: usuariosAtivos,
          inativos: totalUsuarios - usuariosAtivos,
        },
        funcionarios: {
          total: totalFuncionarios,
          ativos: funcionariosAtivos,
          inativos: totalFuncionarios - funcionariosAtivos,
        },
        condominios: {
          total: totalCondominios,
          ativos: condominiosAtivos,
          inativos: totalCondominios - condominiosAtivos,
        },
        empreitadas: {
          total: totalEmpreitadas,
          ativas: empreitadasAtivas,
          concluidas: totalEmpreitadas - empreitadasAtivas,
          valor_total: valorTotalEmpreitadas._sum.valorTotal || 0,
        },
        ferramentas: {
          total: totalFerramentas,
          por_localizacao: ferramentasPorLocalizacao.map((f: { localizacaoAtual: string | null, _count: { id: number } }) => ({
            localizacao: f.localizacaoAtual || 'Desconhecida',
            quantidade: f._count.id,
          })),
        },
        contratos: { total: totalContratos },
        retiradas: {
          total: totalRetiradas,
          valor_total: valorTotalRetiradas._sum.valor || 0,
        },
        financeiro: {
          valor_empreitadas: valorTotalEmpreitadas._sum.valorTotal || 0,
          valor_retirado: valorTotalRetiradas._sum.valor || 0,
          saldo: (valorTotalEmpreitadas._sum.valorTotal || 0) - (valorTotalRetiradas._sum.valor || 0),
        },
        ultimas_atividades: ultimasAtividades.map((ativ: {
          id: number
          acao: string
          campoAlterado: string | null
          valorAnterior: string | null
          valorNovo: string | null
          dataAlteracao: Date
          empreitada: { nome: string }
          usuario: { nome: string } | null
        }) => ({
          id: ativ.id,
          acao: ativ.acao,
          campo: ativ.campoAlterado,
          valor_anterior: ativ.valorAnterior,
          valor_novo: ativ.valorNovo,
          data: ativ.dataAlteracao,
          empreitada: ativ.empreitada?.nome,
          usuario: ativ.usuario?.nome,
        })),
        empreitadas_por_mes: Object.entries(empreitadasPorMes).map(([mes, dados]) => ({
          mes,
          count: dados.count,
          valor: dados.valor,
        })),
        sistema: {
          versao: '2.0.0',
          ambiente: process.env.NODE_ENV,
          nextjs: '15.x',
          database: 'PostgreSQL',
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar estatísticas' })
  }
}
