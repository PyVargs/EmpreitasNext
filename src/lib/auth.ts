import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          throw new Error('Login e senha são obrigatórios')
        }

        // Importação dinâmica do Prisma
        let prisma
        try {
          const prismaModule = await import('./prisma')
          prisma = prismaModule.default
        } catch (error) {
          console.error('Erro ao carregar Prisma:', error)
          throw new Error('Erro de conexão com o banco de dados')
        }

        const user = await prisma.usuario.findUnique({
          where: { login: credentials.login },
        })

        if (!user) {
          throw new Error('Usuário não encontrado')
        }

        if (user.ativo === false) {
          throw new Error('Usuário inativo')
        }

        // Verificar se está bloqueado
        if (user.bloqueadoAte && new Date(user.bloqueadoAte) > new Date()) {
          const minutosRestantes = Math.ceil(
            (new Date(user.bloqueadoAte).getTime() - new Date().getTime()) / 60000
          )
          throw new Error(`Usuário bloqueado. Tente novamente em ${minutosRestantes} minutos`)
        }

        // Verificar senha
        if (!user.senhaHash) {
          throw new Error('Senha não configurada para este usuário')
        }

        // Suporta tanto werkzeug (Flask) quanto bcrypt
        const isPasswordValid = await verifyPassword(credentials.password, user.senhaHash)

        if (!isPasswordValid) {
          // Incrementar tentativas de login falhas
          const novasTentativas = (user.tentativasLoginFalhas || 0) + 1
          const bloqueadoAte = novasTentativas >= 5 
            ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
            : null

          await prisma.usuario.update({
            where: { id: user.id },
            data: {
              tentativasLoginFalhas: novasTentativas,
              bloqueadoAte,
              ultimaTentativaLogin: new Date(),
            },
          })

          throw new Error('Senha incorreta')
        }

        // Reset tentativas em caso de sucesso
        await prisma.usuario.update({
          where: { id: user.id },
          data: {
            tentativasLoginFalhas: 0,
            bloqueadoAte: null,
            ultimaTentativaLogin: new Date(),
          },
        })

        return {
          id: user.id.toString(),
          name: user.nome,
          email: user.login,
          admin: user.admin ?? false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.admin = (user as { admin?: boolean }).admin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.admin = token.admin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
}
