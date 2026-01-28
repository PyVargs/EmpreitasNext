import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/fornecedores - Listar fornecedores
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

    const fornecedores = await prisma.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    })

    const fornecedoresFormatados = fornecedores.map((f: {
      id: number
      nome: string
      cnpjCpf: string | null
      telefone: string | null
      email: string | null
      endereco: string | null
      cidade: string | null
      estado: string | null
      cep: string | null
      observacoes: string | null
      ativo: boolean | null
    }) => ({
      id: f.id.toString(),
      nome: f.nome,
      cnpj_cpf: f.cnpjCpf,
      telefone: f.telefone,
      email: f.email,
      endereco: f.endereco,
      cidade: f.cidade,
      estado: f.estado,
      cep: f.cep,
      observacoes: f.observacoes,
      ativo: f.ativo ?? true,
    }))

    return NextResponse.json({
      success: true,
      data: fornecedoresFormatados,
    })
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/fornecedores - Criar fornecedor
export async function POST(req: Request) {
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

    const data = await req.json()

    const novoFornecedor = await prisma.fornecedor.create({
      data: {
        nome: data.nome,
        cnpjCpf: data.cnpj_cpf,
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        observacoes: data.observacoes,
        ativo: true,
        dataCriacao: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: novoFornecedor.id.toString(),
        nome: novoFornecedor.nome,
      },
    })
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar fornecedor' })
  }
}
