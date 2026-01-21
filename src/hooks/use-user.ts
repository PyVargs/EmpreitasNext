'use client'

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

export function useUser() {
  const { data: session, status } = useSession()

  const loading = status === 'loading'
  const user = session?.user

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/login' })
  }

  return {
    user,
    loading,
    signOut,
    isAdmin: user?.admin ?? false,
    isAuthenticated: !!user,
  }
}
