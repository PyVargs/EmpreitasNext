import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/admin/usuarios - Listar usuários
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
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

    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        login: true,
        admin: true,
        ativo: true,
        tentativasLoginFalhas: true,
        bloqueadoAte: true,
        ultimaTentativaLogin: true,
      },
    })

    const usuariosFormatados = usuarios.map((u: {
      id: number
      nome: string
      login: string
      admin: boolean | null
      ativo: boolean | null
      tentativasLoginFalhas: number | null
      bloqueadoAte: Date | null
      ultimaTentativaLogin: Date | null
    }) => ({
      id: u.id.toString(),
      nome: u.nome,
      login: u.login,
      admin: u.admin ?? false,
      ativo: u.ativo ?? true,
      tentativas_login_falhas: u.tentativasLoginFalhas ?? 0,
      bloqueado_ate: u.bloqueadoAte,
      ultima_tentativa_login: u.ultimaTentativaLogin,
      bloqueado: u.bloqueadoAte ? new Date(u.bloqueadoAte) > new Date() : false,
    }))

    return NextResponse.json({
      success: true,
      data: usuariosFormatados,
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados' })
  }
}

// POST /api/admin/usuarios - Criar novo usuário
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session.user?.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { nome, login, senha, admin } = body

    if (!nome || !login || !senha) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: nome, login, senha',
      }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres',
      }, { status: 400 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se login já existe
    const loginExistente = await prisma.usuario.findUnique({
      where: { login },
    })

    if (loginExistente) {
      return NextResponse.json({
        success: false,
        error: 'Login já está em uso',
      }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        login,
        senhaHash,
        admin: admin ?? false,
        ativo: true,
        tentativasLoginFalhas: 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: usuario.id.toString(),
        nome: usuario.nome,
        login: usuario.login,
        admin: usuario.admin,
        ativo: usuario.ativo,
      },
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
