import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/dashboard - Estatísticas do dashboard
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parâmetro para incluir empreitadas concluídas no cálculo de valor total
    const { searchParams } = new URL(req.url)
    const incluirConcluidas = searchParams.get('incluir_concluidas') === 'true'

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      console.error('Prisma não disponível')
      return NextResponse.json({
        success: false,
        error: 'Banco de dados não configurado',
        data: getEmptyStats(),
      })
    }

    // Buscar dados em paralelo
    const [
      funcionarios,
      condominios,
      empreitadasAtivas,
      empreitadasConcluidas,
      todasEmpreitadas,
      ferramentas,
      contratosAtivos,
      contasAtrasadas,
      contasVencendoHoje,
      retiradasPorMes,
    ] = await Promise.all([
      prisma.funcionario.count(),
      prisma.condominio.count({ where: { ativo: true } }),
      prisma.empreitada.findMany({
        where: { concluida: false },
        include: {
          retiradas: { select: { valor: true } },
        },
      }),
      prisma.empreitada.count({ where: { concluida: true } }),
      // Buscar todas as empreitadas para cálculo quando incluir concluídas
      prisma.empreitada.findMany({
        include: {
          retiradas: { select: { valor: true } },
        },
      }),
      prisma.ferramenta.groupBy({
        by: ['localizacaoAtual'],
        _count: true,
      }),
      prisma.contrato.count({ where: { status: 'ativo' } }),
      prisma.contaPagar.count({
        where: { status: 'Atrasado' },
      }),
      prisma.contaPagar.count({
        where: {
          status: 'Pendente',
          dataVencimento: {
            gte: new Date(new Date().toISOString().split('T')[0]),
            lt: new Date(new Date().setDate(new Date().getDate() + 1)),
          },
        },
      }),
      // Retiradas dos últimos 6 meses
      getRetiradasPorMes(prisma),
    ])

    // Top funcionários (com base no filtro)
    const topFuncionarios = await getTopFuncionarios(prisma, incluirConcluidas)

    // Calcular totais de empreitadas (baseado no filtro)
    let valorTotalEmpreitadas = 0
    let valorTotalRetirado = 0

    // Valores apenas das empreitadas ativas
    let valorTotalEmpreitadasAtivas = 0
    let valorTotalRetiradoAtivas = 0

    empreitadasAtivas.forEach((e) => {
      valorTotalEmpreitadasAtivas += e.valorTotal
      valorTotalRetiradoAtivas += e.retiradas.reduce((acc, r) => acc + r.valor, 0)
    })

    // Valores de todas as empreitadas (ativas + concluídas)
    let valorTotalEmpreitadasTodas = 0
    let valorTotalRetiradoTodas = 0

    todasEmpreitadas.forEach((e) => {
      valorTotalEmpreitadasTodas += e.valorTotal
      valorTotalRetiradoTodas += e.retiradas.reduce((acc, r) => acc + r.valor, 0)
    })

    // Usar valores baseados no filtro
    if (incluirConcluidas) {
      valorTotalEmpreitadas = valorTotalEmpreitadasTodas
      valorTotalRetirado = valorTotalRetiradoTodas
    } else {
      valorTotalEmpreitadas = valorTotalEmpreitadasAtivas
      valorTotalRetirado = valorTotalRetiradoAtivas
    }

    // Processar ferramentas
    const ferramentasStats = {
      cd: 0,
      emprestadas: 0,
      manutencao: 0,
    }

    ferramentas.forEach((f) => {
      const loc = f.localizacaoAtual?.toUpperCase() || ''
      if (loc === 'CD' || loc === 'DEPOSITO') ferramentasStats.cd = f._count
      else if (loc === 'FUNCIONARIO' || loc === 'EMPRESTADA') ferramentasStats.emprestadas = f._count
      else if (loc === 'MANUTENCAO') ferramentasStats.manutencao = f._count
    })

    return NextResponse.json({
      success: true,
      data: {
        valor_total_empreitadas: valorTotalEmpreitadas,
        valor_total_retirado: valorTotalRetirado,
        saldo_disponivel: valorTotalEmpreitadas - valorTotalRetirado,
        // Valores separados para referência
        valor_empreitadas_ativas: valorTotalEmpreitadasAtivas,
        valor_retirado_ativas: valorTotalRetiradoAtivas,
        valor_empreitadas_todas: valorTotalEmpreitadasTodas,
        valor_retirado_todas: valorTotalRetiradoTodas,
        incluir_concluidas: incluirConcluidas,
        ferramentas_cd: ferramentasStats.cd,
        ferramentas_emprestadas: ferramentasStats.emprestadas,
        ferramentas_manutencao: ferramentasStats.manutencao,
        total_funcionarios: funcionarios,
        total_condominios: condominios,
        total_contratos_ativos: contratosAtivos,
        empreitadas_ativas: empreitadasAtivas.length,
        empreitadas_concluidas: empreitadasConcluidas,
        contas_vencendo_hoje: contasVencendoHoje,
        contas_atrasadas: contasAtrasadas,
        retiradas_por_mes: retiradasPorMes,
        top_funcionarios: topFuncionarios,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao conectar ao banco de dados',
      data: getEmptyStats(),
    })
  }
}

// Buscar retiradas agrupadas por mês (últimos 6 meses)
async function getRetiradasPorMes(prisma: any) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const hoje = new Date()
  const resultado = []

  for (let i = 5; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesIndex = data.getMonth()
    const ano = data.getFullYear()
    
    const inicioMes = new Date(ano, mesIndex, 1)
    const fimMes = new Date(ano, mesIndex + 1, 0, 23, 59, 59)

    const retiradas = await prisma.retirada.aggregate({
      where: {
        data: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      _sum: {
        valor: true,
      },
    })

    resultado.push({
      name: meses[mesIndex],
      valor: retiradas._sum.valor || 0,
    })
  }

  return resultado
}

// Buscar top 5 funcionários com maior saldo (valor_empreitadas - valor_retiradas)
async function getTopFuncionarios(prisma: any, incluirConcluidas: boolean = false) {
  const funcionarios = await prisma.funcionario.findMany({
    include: {
      empreitadas: {
        where: incluirConcluidas ? {} : { concluida: false },
        include: {
          retiradas: {
            select: { valor: true },
          },
        },
      },
    },
  })

  const funcionariosComSaldo = funcionarios.map((f: any) => {
    let valorTotal = 0
    let valorRetirado = 0

    f.empreitadas.forEach((e: any) => {
      valorTotal += e.valorTotal
      valorRetirado += e.retiradas.reduce((acc: number, r: any) => acc + r.valor, 0)
    })

    return {
      id: f.id,
      nome: f.nome,
      saldo: valorTotal - valorRetirado,
    }
  })

  // Ordenar por saldo decrescente e pegar top 5
  return funcionariosComSaldo
    .filter((f: any) => f.saldo > 0)
    .sort((a: any, b: any) => b.saldo - a.saldo)
    .slice(0, 5)
}

function getEmptyStats() {
  return {
    valor_total_empreitadas: 0,
    valor_total_retirado: 0,
    saldo_disponivel: 0,
    valor_empreitadas_ativas: 0,
    valor_retirado_ativas: 0,
    valor_empreitadas_todas: 0,
    valor_retirado_todas: 0,
    incluir_concluidas: false,
    ferramentas_cd: 0,
    ferramentas_emprestadas: 0,
    ferramentas_manutencao: 0,
    total_funcionarios: 0,
    total_condominios: 0,
    total_contratos_ativos: 0,
    empreitadas_ativas: 0,
    empreitadas_concluidas: 0,
    contas_vencendo_hoje: 0,
    contas_atrasadas: 0,
    retiradas_por_mes: [],
    top_funcionarios: [],
  }
}
