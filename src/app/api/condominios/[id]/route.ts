import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/condominios/[id] - Buscar condomínio específico
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

    const condominio = await prisma.condominio.findUnique({
      where: { id: parseInt(id) },
      include: {
        empreitadas: {
          select: {
            id: true,
            nome: true,
            valorTotal: true,
            concluida: true,
            data: true,
            funcionario: {
              select: { id: true, nome: true },
            },
            retiradas: {
              select: { valor: true },
            },
          },
          orderBy: { data: 'desc' },
        },
        contratos: {
          select: {
            id: true,
            nomeServico: true,
            valorTotal: true,
            dataInicio: true,
            dataFim: true,
            status: true,
          },
          orderBy: { dataInicio: 'desc' },
        },
        ferramentas: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            localizacaoAtual: true,
            funcionarioAtual: true,
          },
        },
      },
    })

    if (!condominio) {
      return NextResponse.json({ success: false, error: 'Condomínio não encontrado' }, { status: 404 })
    }

    // Calcular totais das empreitadas
    const empreitadasFormatadas = condominio.empreitadas.map((emp: {
      id: number
      nome: string
      valorTotal: number
      concluida: boolean | null
      data: Date | null
      funcionario: { id: number; nome: string }
      retiradas: { valor: number }[]
    }) => {
      const totalRetirado = emp.retiradas.reduce((acc, r) => acc + r.valor, 0)
      return {
        id: emp.id.toString(),
        nome: emp.nome,
        valor_total: emp.valorTotal,
        total_retirado: totalRetirado,
        saldo: emp.valorTotal - totalRetirado,
        concluida: emp.concluida || false,
        data: emp.data,
        funcionario: emp.funcionario,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: condominio.id.toString(),
        nome: condominio.nome,
        cnpj: condominio.cnpj,
        endereco: condominio.endereco,
        sindico: condominio.sindico,
        telefone: condominio.telefone,
        email: condominio.email,
        ativo: condominio.ativo,
        data_criacao: condominio.dataCriacao,
        empreitadas: empreitadasFormatadas,
        contratos: condominio.contratos.map((c: {
          id: number
          nomeServico: string
          valorTotal: number
          dataInicio: Date
          dataFim: Date | null
          status: string | null
        }) => ({
          id: c.id.toString(),
          nome_servico: c.nomeServico,
          valor_total: c.valorTotal,
          data_inicio: c.dataInicio,
          data_fim: c.dataFim,
          status: c.status,
        })),
        ferramentas: condominio.ferramentas.map((f: {
          id: number
          codigo: string
          nome: string
          localizacaoAtual: string | null
          funcionarioAtual: string | null
        }) => ({
          id: f.id.toString(),
          codigo: f.codigo,
          nome: f.nome,
          localizacao: f.localizacaoAtual,
          funcionario: f.funcionarioAtual,
        })),
        stats: {
          total_empreitadas: condominio.empreitadas.length,
          empreitadas_ativas: condominio.empreitadas.filter((e: { concluida: boolean | null }) => !e.concluida).length,
          total_contratos: condominio.contratos.length,
          total_ferramentas: condominio.ferramentas.length,
          valor_empreitadas: empreitadasFormatadas.reduce((acc: number, e: { valor_total: number }) => acc + e.valor_total, 0),
          valor_retirado: empreitadasFormatadas.reduce((acc: number, e: { total_retirado: number }) => acc + e.total_retirado, 0),
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar condomínio:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar condomínio' })
  }
}

// PUT /api/condominios/[id] - Atualizar condomínio
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
    const body = await request.json()
    const { nome, cnpj, endereco, sindico, telefone, email, ativo } = body

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se o condomínio existe
    const condominioExistente = await prisma.condominio.findUnique({
      where: { id: parseInt(id) },
    })

    if (!condominioExistente) {
      return NextResponse.json({ success: false, error: 'Condomínio não encontrado' }, { status: 404 })
    }

    // Se mudou CNPJ, verificar se já existe outro com o mesmo
    if (cnpj && cnpj !== condominioExistente.cnpj) {
      const cnpjExistente = await prisma.condominio.findFirst({
        where: { cnpj, id: { not: parseInt(id) } },
      })
      if (cnpjExistente) {
        return NextResponse.json({ success: false, error: 'CNPJ já cadastrado em outro condomínio' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (nome !== undefined) updateData.nome = nome
    if (cnpj !== undefined) updateData.cnpj = cnpj
    if (endereco !== undefined) updateData.endereco = endereco
    if (sindico !== undefined) updateData.sindico = sindico
    if (telefone !== undefined) updateData.telefone = telefone
    if (email !== undefined) updateData.email = email
    if (ativo !== undefined) updateData.ativo = ativo

    const condominio = await prisma.condominio.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: condominio.id.toString(),
        nome: condominio.nome,
        cnpj: condominio.cnpj,
        endereco: condominio.endereco,
        sindico: condominio.sindico,
        telefone: condominio.telefone,
        email: condominio.email,
        ativo: condominio.ativo,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar condomínio' })
  }
}

// DELETE /api/condominios/[id] - Desativar condomínio (soft delete)
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

    const condominio = await prisma.condominio.findUnique({
      where: { id: parseInt(id) },
      include: {
        empreitadas: { where: { concluida: false } },
        contratos: { where: { status: 'ativo' } },
      },
    })

    if (!condominio) {
      return NextResponse.json({ success: false, error: 'Condomínio não encontrado' }, { status: 404 })
    }

    // Verificar se há empreitadas ativas
    if (condominio.empreitadas.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Não é possível desativar. Existem ${condominio.empreitadas.length} empreitada(s) ativa(s).`,
      }, { status: 400 })
    }

    // Soft delete - apenas desativa
    await prisma.condominio.update({
      where: { id: parseInt(id) },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true, message: 'Condomínio desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar condomínio:', error)
    return NextResponse.json({ success: false, error: 'Erro ao desativar condomínio' })
  }
}
