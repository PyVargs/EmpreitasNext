import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/relatorio - Dados completos para relatório
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

    // Buscar estatísticas básicas
    const [
      totalUsuarios,
      usuariosAtivos,
      totalFuncionarios,
      totalCondominios,
      condominiosAtivos,
      totalEmpreitadas,
      empreitadasAtivas,
      totalFerramentas,
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
      prisma.retirada.count(),
      prisma.empreitada.aggregate({ _sum: { valorTotal: true } }),
      prisma.retirada.aggregate({ _sum: { valor: true } }),
    ])

    // Ferramentas por localização
    const ferramentasPorLocalizacao = await prisma.ferramenta.groupBy({
      by: ['localizacaoAtual'],
      _count: { id: true },
    })

    // Empreitadas ativas com detalhes
    const empreitadasAtivasDetalhes = await prisma.empreitada.findMany({
      where: { concluida: false },
      include: {
        condominio: { select: { nome: true } },
        funcionario: { select: { nome: true } },
        retiradas: { select: { valor: true } },
      },
      orderBy: { valorTotal: 'desc' },
    })

    const empreitadasAtivasFormatadas = empreitadasAtivasDetalhes.map((emp) => {
      const valorRetirado = emp.retiradas.reduce((sum, r) => sum + r.valor, 0)
      return {
        nome: emp.nome,
        condominio: emp.condominio?.nome || 'N/A',
        funcionario: emp.funcionario?.nome || 'N/A',
        valor_total: emp.valorTotal,
        valor_retirado: valorRetirado,
        saldo: emp.valorTotal - valorRetirado,
      }
    })

    // Ferramentas emprestadas
    const ferramentasEmprestadas = await prisma.ferramenta.findMany({
      where: { localizacaoAtual: 'FUNCIONARIO' },
      select: {
        nome: true,
        codigo: true,
        funcionarioAtual: true,
        obraAtual: true,
      },
      orderBy: { nome: 'asc' },
    })

    const ferramentasFormatadas = ferramentasEmprestadas.map((fer) => ({
      nome: fer.nome,
      codigo: fer.codigo,
      funcionario: fer.funcionarioAtual || 'N/A',
      obra: fer.obraAtual,
    }))

    // Últimas atividades
    const ultimasAtividades = await prisma.historicoEmpreitada.findMany({
      take: 10,
      orderBy: { dataAlteracao: 'desc' },
      include: {
        empreitada: { select: { nome: true } },
        usuario: { select: { nome: true } },
      },
    })

    const atividadesFormatadas = ultimasAtividades.map((ativ) => ({
      empreitada: ativ.empreitada?.nome || 'N/A',
      acao: ativ.acao,
      usuario: ativ.usuario?.nome || 'Sistema',
      data: ativ.dataAlteracao.toISOString(),
    }))

    // Resumo por condomínio
    const condominiosComEmpreitadas = await prisma.condominio.findMany({
      where: {
        empreitadas: {
          some: {},
        },
      },
      include: {
        empreitadas: {
          include: {
            retiradas: { select: { valor: true } },
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    const condominiosResumo = condominiosComEmpreitadas.map((cond) => {
      const empreitadasAtivas = cond.empreitadas.filter((e) => !e.concluida)
      const valorTotal = cond.empreitadas.reduce((sum, e) => sum + e.valorTotal, 0)
      const valorRetirado = cond.empreitadas.reduce(
        (sum, e) => sum + e.retiradas.reduce((s, r) => s + r.valor, 0),
        0
      )
      return {
        nome: cond.nome,
        empreitadas_ativas: empreitadasAtivas.length,
        valor_total: valorTotal,
        saldo: valorTotal - valorRetirado,
      }
    }).filter((c) => c.empreitadas_ativas > 0 || c.valor_total > 0)

    const valorEmpreitadas = valorTotalEmpreitadas._sum.valorTotal || 0
    const valorRetirado = valorTotalRetiradas._sum.valor || 0

    return NextResponse.json({
      success: true,
      data: {
        geradoEm: new Date().toISOString(),
        estatisticas: {
          usuarios: { total: totalUsuarios, ativos: usuariosAtivos },
          funcionarios: { total: totalFuncionarios, ativos: totalFuncionarios },
          condominios: { total: totalCondominios, ativos: condominiosAtivos },
          empreitadas: {
            total: totalEmpreitadas,
            ativas: empreitadasAtivas,
            concluidas: totalEmpreitadas - empreitadasAtivas,
            valor_total: valorEmpreitadas,
          },
          ferramentas: {
            total: totalFerramentas,
            por_localizacao: ferramentasPorLocalizacao.map((f) => ({
              localizacao: f.localizacaoAtual || 'Desconhecida',
              quantidade: f._count.id,
            })),
          },
          retiradas: { total: totalRetiradas, valor_total: valorRetirado },
        },
        financeiro: {
          valor_empreitadas: valorEmpreitadas,
          valor_retirado: valorRetirado,
          saldo: valorEmpreitadas - valorRetirado,
        },
        empreitadasAtivas: empreitadasAtivasFormatadas,
        ferramentasEmprestadas: ferramentasFormatadas,
        ultimasAtividades: atividadesFormatadas,
        condominiosResumo,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar dados do relatório:', error)
    return NextResponse.json({ success: false, error: 'Erro ao gerar relatório' })
  }
}
