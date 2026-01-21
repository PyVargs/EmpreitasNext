import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      admin: boolean
    }
  }

  interface User {
    id: string
    admin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    admin: boolean
  }
}
