import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/ferramentas - Listar ferramentas
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

    const ferramentas = await prisma.ferramenta.findMany({
      include: {
        funcionario: {
          select: { id: true, nome: true },
        },
        condominio: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { nome: 'asc' },
    })

    const ferramentasFormatadas = ferramentas.map((f: any) => ({
      id: f.id.toString(),
      codigo: f.codigo,
      nome: f.nome,
      marca: f.marca,
      descricao: f.descricao,
      localizacao_atual: f.localizacaoAtual,
      funcionario_atual: f.funcionarioAtual,
      funcionario_atual_id: f.funcionarioAtualId?.toString(),
      obra_atual: f.obraAtual,
      condominio_id: f.condominioId?.toString(),
      tipo: f.tipo,
      categoria: f.categoria,
      funcionario: f.funcionario ? {
        id: f.funcionario.id.toString(),
        nome: f.funcionario.nome,
      } : null,
      condominio: f.condominio ? {
        id: f.condominio.id.toString(),
        nome: f.condominio.nome,
      } : null,
    }))

    return NextResponse.json({
      success: true,
      data: ferramentasFormatadas,
    })
  } catch (error) {
    console.error('Erro ao buscar ferramentas:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}
