import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/funcionarios - Listar funcionários
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

    // Buscar funcionários com TODAS as empreitadas e retiradas
    const funcionarios = await prisma.funcionario.findMany({
      include: {
        empreitadas: {
          include: {
            retiradas: {
              select: { valor: true },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    // Calcular totais
    const funcionariosComTotais = funcionarios.map((f: any) => {
      let totalEmpreitadasAtivas = 0
      let totalRetiradoAtivas = 0
      let saldoNegativoConcluidas = 0
      let empreitadasAtivasCount = 0

      f.empreitadas.forEach((e: any) => {
        const valorRetirado = e.retiradas.reduce((acc: number, r: any) => acc + r.valor, 0)
        const saldoEmpreitada = e.valorTotal - valorRetirado

        if (!e.concluida) {
          // Empreitada ativa - soma normal
          totalEmpreitadasAtivas += e.valorTotal
          totalRetiradoAtivas += valorRetirado
          empreitadasAtivasCount++
        } else {
          // Empreitada concluída - só considera se tiver saldo negativo (dívida)
          if (saldoEmpreitada < 0) {
            saldoNegativoConcluidas += saldoEmpreitada
          }
        }
      })

      // Saldo = (ativas) + saldos negativos de concluídas
      const saldoAtivas = totalEmpreitadasAtivas - totalRetiradoAtivas
      const saldoTotal = saldoAtivas + saldoNegativoConcluidas

      // Funcionário está ativo se tem pelo menos uma empreitada ativa
      const estaAtivo = empreitadasAtivasCount > 0

      return {
        id: f.id.toString(),
        nome: f.nome,
        telefone: f.telefone,
        cpf: f.cpf,
        rg: f.rg,
        endereco: f.endereco,
        ativo: estaAtivo,
        total_empreitadas: totalEmpreitadasAtivas,
        total_retirado: totalRetiradoAtivas,
        saldo: saldoTotal,
        saldo_negativo_concluidas: saldoNegativoConcluidas,
        empreitadas_ativas: empreitadasAtivasCount,
      }
    })

    return NextResponse.json({
      success: true,
      data: funcionariosComTotais,
    })
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/funcionarios - Criar funcionário
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, telefone, cpf, rg, endereco } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const funcionario = await prisma.funcionario.create({
      data: {
        nome,
        telefone,
        cpf,
        rg,
        endereco,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: funcionario.id.toString(),
        nome: funcionario.nome,
        telefone: funcionario.telefone,
        cpf: funcionario.cpf,
        rg: funcionario.rg,
        endereco: funcionario.endereco,
        ativo: true,
        total_empreitadas: 0,
        total_retirado: 0,
        saldo: 0,
      },
    })
  } catch (error) {
    console.error('Erro ao criar funcionário:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar funcionário' })
  }
}
