import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/ferramentas/[id] - Buscar ferramenta específica
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

    const ferramenta = await prisma.ferramenta.findUnique({
      where: { id: parseInt(id) },
      include: {
        funcionario: {
          select: { id: true, nome: true },
        },
        condominio: {
          select: { id: true, nome: true },
        },
        historico: {
          orderBy: { data: 'desc' },
          take: 10,
        },
      },
    })

    if (!ferramenta) {
      return NextResponse.json({ success: false, error: 'Ferramenta não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: ferramenta,
    })
  } catch (error) {
    console.error('Erro ao buscar ferramenta:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar ferramenta' }, { status: 500 })
  }
}

// PUT /api/ferramentas/[id] - Atualizar ferramenta (devolver, emprestar, etc)
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

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const data = await request.json()
    const { acao, funcionarioId, observacao } = data

    const ferramentaId = parseInt(id)

    // Buscar ferramenta atual
    const ferramentaAtual = await prisma.ferramenta.findUnique({
      where: { id: ferramentaId },
      include: {
        funcionario: { select: { nome: true } },
      },
    })

    if (!ferramentaAtual) {
      return NextResponse.json({ success: false, error: 'Ferramenta não encontrada' }, { status: 404 })
    }

    // Registrar no histórico
    const registrarHistorico = async (tipo: string, detalhes: string) => {
      try {
        await prisma.historicoFerramenta.create({
          data: {
            ferramentaId: ferramentaId,
            tipo,
            detalhes,
            data: new Date(),
          },
        })
      } catch (e) {
        console.log('Erro ao registrar histórico (tabela pode não existir):', e)
      }
    }

    if (acao === 'devolver') {
      // Devolver ferramenta ao CD
      const ferramenta = await prisma.ferramenta.update({
        where: { id: ferramentaId },
        data: {
          localizacaoAtual: 'CD',
          funcionarioAtual: null,
          funcionarioAtualId: null,
          obraAtual: null,
          condominioId: null,
        },
      })

      await registrarHistorico(
        'DEVOLUCAO',
        `Devolvida ao CD${observacao ? ` - ${observacao}` : ''}`
      )

      return NextResponse.json({
        success: true,
        message: 'Ferramenta devolvida com sucesso!',
        data: ferramenta,
      })
    }

    if (acao === 'emprestar') {
      if (!funcionarioId) {
        return NextResponse.json({ 
          success: false, 
          error: 'ID do funcionário é obrigatório para empréstimo' 
        }, { status: 400 })
      }

      // Buscar funcionário
      const funcionario = await prisma.funcionario.findUnique({
        where: { id: parseInt(funcionarioId) },
      })

      if (!funcionario) {
        return NextResponse.json({ success: false, error: 'Funcionário não encontrado' }, { status: 404 })
      }

      // Emprestar ferramenta
      const ferramenta = await prisma.ferramenta.update({
        where: { id: ferramentaId },
        data: {
          localizacaoAtual: 'FUNCIONARIO',
          funcionarioAtual: funcionario.nome,
          funcionarioAtualId: funcionario.id,
          obraAtual: data.obraAtual || null,
          condominioId: data.condominioId ? parseInt(data.condominioId) : null,
        },
      })

      await registrarHistorico(
        'EMPRESTIMO',
        `Emprestada para ${funcionario.nome}${observacao ? ` - ${observacao}` : ''}`
      )

      return NextResponse.json({
        success: true,
        message: 'Ferramenta emprestada com sucesso!',
        data: ferramenta,
      })
    }

    // Atualização genérica
    const ferramenta = await prisma.ferramenta.update({
      where: { id: ferramentaId },
      data: {
        nome: data.nome || undefined,
        marca: data.marca || undefined,
        descricao: data.descricao || undefined,
        localizacaoAtual: data.localizacaoAtual || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: ferramenta,
    })
  } catch (error) {
    console.error('Erro ao atualizar ferramenta:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar ferramenta' }, { status: 500 })
  }
}
