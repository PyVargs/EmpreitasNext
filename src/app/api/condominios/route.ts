import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/condominios - Listar condomínios
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const condominios = await prisma.condominio.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            empreitadas: true,
            contratos: true,
            ferramentas: true,
          },
        },
      },
    })

    const condominiosFormatados = condominios.map((c: {
      id: number
      nome: string
      cnpj: string
      endereco: string
      sindico: string
      telefone: string | null
      email: string | null
      ativo: boolean | null
      _count: {
        empreitadas: number
        contratos: number
        ferramentas: number
      }
    }) => ({
      id: c.id.toString(),
      nome: c.nome,
      cnpj: c.cnpj,
      endereco: c.endereco,
      sindico: c.sindico,
      telefone: c.telefone,
      email: c.email,
      ativo: c.ativo ?? true,
      total_empreitadas: c._count.empreitadas,
      total_contratos: c._count.contratos,
      total_ferramentas: c._count.ferramentas,
    }))

    return NextResponse.json({
      success: true,
      data: condominiosFormatados,
    })
  } catch (error) {
    console.error('Erro ao buscar condomínios:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/condominios - Criar novo condomínio
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, cnpj, endereco, sindico, telefone, email } = body

    // Validação básica
    if (!nome || !cnpj || !endereco || !sindico) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: nome, cnpj, endereco, sindico',
      }, { status: 400 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se CNPJ já existe
    const cnpjExistente = await prisma.condominio.findUnique({
      where: { cnpj },
    })

    if (cnpjExistente) {
      return NextResponse.json({
        success: false,
        error: 'CNPJ já cadastrado',
      }, { status: 400 })
    }

    const condominio = await prisma.condominio.create({
      data: {
        nome,
        cnpj,
        endereco,
        sindico,
        telefone: telefone || null,
        email: email || null,
        ativo: true,
        dataCriacao: new Date(),
      },
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
    console.error('Erro ao criar condomínio:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar condomínio' }, { status: 500 })
  }
}
