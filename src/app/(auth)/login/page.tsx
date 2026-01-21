'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (result?.ok) {
        toast.success('Login realizado com sucesso!')
        // Força o redirecionamento via window.location para garantir que funcione
        window.location.href = '/dashboard'
      }
    } catch {
      toast.error('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center pb-2">
        <div className="flex justify-center mb-4">
          <Image 
            src="/VBS.png" 
            alt="VBS Logo" 
            width={64} 
            height={64}
            className="object-contain"
          />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-200 to-teal-300 bg-clip-text text-transparent">
          Via Brasil Sul
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">Sistema de Gestão de Obras e Reformas</span>
          <span className="block text-xs text-muted-foreground/70">por Eduardo Vargas</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="seu.usuario"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
