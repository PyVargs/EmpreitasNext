import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PUT /api/admin/usuarios/[id] - Atualizar usuário
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session.user?.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { nome, login, senha, admin, ativo, desbloquear, resetarSenha } = body

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Verificar se usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: userId },
    })

    if (!usuarioExistente) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permitir desativar o próprio usuário logado
    if (ativo === false && session.user?.id === id) {
      return NextResponse.json({
        success: false,
        error: 'Você não pode desativar sua própria conta',
      }, { status: 400 })
    }

    // Não permitir remover admin do próprio usuário
    if (admin === false && session.user?.id === id) {
      return NextResponse.json({
        success: false,
        error: 'Você não pode remover seu próprio status de administrador',
      }, { status: 400 })
    }

    // Verificar se login já existe em outro usuário
    if (login && login !== usuarioExistente.login) {
      const loginExistente = await prisma.usuario.findUnique({
        where: { login },
      })
      if (loginExistente) {
        return NextResponse.json({
          success: false,
          error: 'Login já está em uso',
        }, { status: 400 })
      }
    }

    // Preparar dados de atualização
    const updateData: {
      nome?: string
      login?: string
      admin?: boolean
      ativo?: boolean
      senhaHash?: string
      bloqueadoAte?: null
      tentativasLoginFalhas?: number
    } = {}

    if (nome !== undefined) updateData.nome = nome
    if (login !== undefined) updateData.login = login
    if (admin !== undefined) updateData.admin = admin
    if (ativo !== undefined) updateData.ativo = ativo

    // Desbloquear usuário
    if (desbloquear) {
      updateData.bloqueadoAte = null
      updateData.tentativasLoginFalhas = 0
    }

    // Reset ou atualizar senha
    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json({
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres',
        }, { status: 400 })
      }
      updateData.senhaHash = await bcrypt.hash(senha, 10)
    } else if (resetarSenha) {
      // Resetar para senha padrão: login123
      updateData.senhaHash = await bcrypt.hash('login123', 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        login: true,
        admin: true,
        ativo: true,
        bloqueadoAte: true,
        tentativasLoginFalhas: true,
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
        bloqueado: usuario.bloqueadoAte ? new Date(usuario.bloqueadoAte) > new Date() : false,
      },
      message: resetarSenha ? 'Senha resetada para: login123' : 'Usuário atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

// DELETE /api/admin/usuarios/[id] - Excluir usuário
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!session.user?.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    // Não permitir excluir o próprio usuário
    if (session.user?.id === id) {
      return NextResponse.json({
        success: false,
        error: 'Você não pode excluir sua própria conta',
      }, { status: 400 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: userId },
    })

    if (!usuarioExistente) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se é o único admin
    if (usuarioExistente.admin) {
      const totalAdmins = await prisma.usuario.count({
        where: { admin: true, ativo: true },
      })
      if (totalAdmins <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Não é possível excluir o único administrador do sistema',
        }, { status: 400 })
      }
    }

    // Ao invés de excluir, apenas desativar para preservar histórico
    await prisma.usuario.update({
      where: { id: userId },
      data: { ativo: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário desativado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
