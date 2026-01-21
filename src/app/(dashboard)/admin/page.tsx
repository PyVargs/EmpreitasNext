'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { RelatorioDownloadButton } from '@/components/pdf/relatorio-download-button'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/constants'
import {
  Settings,
  Users,
  BarChart3,
  Shield,
  Plus,
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Key,
  Unlock,
  Loader2,
  Building2,
  Briefcase,
  Wrench,
  DollarSign,
  FileText,
  Activity,
  Server,
  Database,
  Code,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string
  nome: string
  login: string
  admin: boolean
  ativo: boolean
  bloqueado: boolean
  tentativas_login_falhas: number
  ultima_tentativa_login?: string
}

interface Stats {
  usuarios: { total: number; ativos: number; inativos: number }
  funcionarios: { total: number; ativos: number; inativos: number }
  condominios: { total: number; ativos: number; inativos: number }
  empreitadas: { total: number; ativas: number; concluidas: number; valor_total: number }
  ferramentas: { total: number; por_localizacao: { localizacao: string; quantidade: number }[] }
  contratos: { total: number }
  retiradas: { total: number; valor_total: number }
  financeiro: { valor_empreitadas: number; valor_retirado: number; saldo: number }
  ultimas_atividades: {
    id: number
    acao: string
    campo?: string
    valor_anterior?: string
    valor_novo?: string
    data: string
    empreitada?: string
    usuario?: string
  }[]
  sistema: { versao: string; ambiente: string; nextjs: string; database: string }
}

interface RelatorioData {
  geradoEm: string
  estatisticas: {
    usuarios: { total: number; ativos: number }
    funcionarios: { total: number; ativos: number }
    condominios: { total: number; ativos: number }
    empreitadas: { total: number; ativas: number; concluidas: number; valor_total: number }
    ferramentas: { total: number; por_localizacao: { localizacao: string; quantidade: number }[] }
    retiradas: { total: number; valor_total: number }
  }
  financeiro: {
    valor_empreitadas: number
    valor_retirado: number
    saldo: number
  }
  empreitadasAtivas: {
    nome: string
    condominio: string
    funcionario: string
    valor_total: number
    valor_retirado: number
    saldo: number
  }[]
  ferramentasEmprestadas: {
    nome: string
    codigo: string
    funcionario: string
    obra?: string
  }[]
  ultimasAtividades: {
    empreitada: string
    acao: string
    usuario: string
    data: string
  }[]
  condominiosResumo: {
    nome: string
    empreitadas_ativas: number
    valor_total: number
    saldo: number
  }[]
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    senha: '',
    admin: false,
  })
  const [editFormData, setEditFormData] = useState({
    nome: '',
    login: '',
    senha: '',
    admin: false,
    ativo: true,
  })
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (!session.user?.admin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      router.push('/')
      return
    }
    fetchUsuarios()
    fetchStats()
  }, [session, status, router])

  async function fetchUsuarios() {
    setLoadingUsuarios(true)
    try {
      const response = await fetch('/api/admin/usuarios')
      const data = await response.json()
      if (data.success) {
        setUsuarios(data.data)
      } else {
        toast.error(data.error || 'Erro ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao buscar usuários')
    } finally {
      setLoadingUsuarios(false)
    }
  }

  async function fetchStats() {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error(data.error || 'Erro ao carregar estatísticas')
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Usuário criado com sucesso!')
        setDialogOpen(false)
        setFormData({ nome: '', login: '', senha: '', admin: false })
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Erro ao criar usuário')
      }
    } catch {
      toast.error('Erro ao criar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUsuario) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${selectedUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || 'Usuário atualizado com sucesso!')
        setEditDialogOpen(false)
        setSelectedUsuario(null)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Erro ao atualizar usuário')
      }
    } catch {
      toast.error('Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setEditFormData({
      nome: usuario.nome,
      login: usuario.login,
      senha: '',
      admin: usuario.admin,
      ativo: usuario.ativo,
    })
    setEditDialogOpen(true)
  }

  const handleToggleAtivo = async (usuario: Usuario) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Usuário ${data.data.ativo ? 'ativado' : 'desativado'} com sucesso!`)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Erro ao atualizar usuário')
      }
    } catch {
      toast.error('Erro ao atualizar usuário')
    }
  }

  const handleDesbloquear = async (usuario: Usuario) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desbloquear: true }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Usuário desbloqueado com sucesso!')
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Erro ao desbloquear usuário')
      }
    } catch {
      toast.error('Erro ao desbloquear usuário')
    }
  }

  const handleResetarSenha = async (usuario: Usuario) => {
    if (!window.confirm(`Deseja resetar a senha do usuário "${usuario.nome}" para "login123"?`)) return
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetarSenha: true }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || 'Senha resetada para: login123')
      } else {
        toast.error(data.error || 'Erro ao resetar senha')
      }
    } catch {
      toast.error('Erro ao resetar senha')
    }
  }

  const handleGerarRelatorio = async () => {
    setGeneratingPDF(true)
    try {
      const response = await fetch('/api/admin/relatorio')
      const data = await response.json()
      if (data.success) {
        setRelatorioData(data.data)
        toast.success('Relatório pronto para download!')
      } else {
        toast.error(data.error || 'Erro ao gerar relatório')
      }
    } catch {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (status === 'loading') {
    return (
      <>
        <Header title="Carregando..." description="" />
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </>
    )
  }

  if (!session?.user?.admin) {
    return null
  }

  return (
    <>
      <Header title="Administração" description="Configurações e gerenciamento do sistema" />

      <div className="p-6">
        <PageHeader
          title="Administração do Sistema"
          description="Gerencie usuários, visualize estatísticas e configure o sistema"
        >
          <div className="flex items-center gap-2">
            {relatorioData ? (
              <RelatorioDownloadButton 
                data={relatorioData} 
                onDownloaded={() => setRelatorioData(null)}
              />
            ) : (
              <Button
                variant="outline"
                onClick={handleGerarRelatorio}
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo usuário do sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Nome do usuário"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login">Login *</Label>
                    <Input
                      id="login"
                      placeholder="login_usuario"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="admin"
                      checked={formData.admin}
                      onChange={(e) => setFormData({ ...formData, admin: e.target.checked })}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </PageHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciamento de Usuários
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{usuario.login}</TableCell>
                          <TableCell>
                            {usuario.admin ? (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Usuário</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {usuario.bloqueado ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Bloqueado
                                </Badge>
                              ) : usuario.ativo ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditDialog(usuario)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetarSenha(usuario)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Resetar Senha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {usuario.bloqueado && (
                                  <DropdownMenuItem onClick={() => handleDesbloquear(usuario)}>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Desbloquear
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleAtivo(usuario)}>
                                  {usuario.ativo ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Estatísticas */}
          <TabsContent value="estatisticas" className="space-y-4">
            {loadingStats ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : stats ? (
              <>
                {/* Cards de resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.funcionarios.total}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.funcionarios.ativos} ativos
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Condomínios</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.condominios.total}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.condominios.ativos} ativos
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Empreitadas</CardTitle>
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.empreitadas.total}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.empreitadas.ativas} ativas
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ferramentas</CardTitle>
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.ferramentas.total}</div>
                      <p className="text-xs text-muted-foreground">cadastradas</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cards financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Valor Total Empreitadas</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-500">
                        {formatCurrency(stats.financeiro.valor_empreitadas)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Retirado</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">
                        {formatCurrency(stats.financeiro.valor_retirado)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stats.financeiro.saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.financeiro.saldo)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ferramentas por localização e atividades recentes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Ferramentas por Localização</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.ferramentas.por_localizacao.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.localizacao || 'Não definida'}</span>
                            <Badge variant="secondary">{item.quantidade}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Activity className="h-4 w-4" />
                        Últimas Atividades
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {stats.ultimas_atividades.length > 0 ? (
                          stats.ultimas_atividades.map((ativ) => (
                            <div key={ativ.id} className="flex items-start gap-3 text-sm">
                              <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
                              <div className="flex-1">
                                <p className="font-medium">{ativ.empreitada}</p>
                                <p className="text-muted-foreground text-xs">
                                  {ativ.acao} por {ativ.usuario || 'Sistema'}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatDateTime(ativ.data)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">Nenhuma atividade registrada</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Erro ao carregar estatísticas
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Sistema */}
          <TabsContent value="sistema" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Informações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Versão</span>
                    <Badge variant="secondary">v2.0.0</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Ambiente</span>
                    <Badge className={process.env.NODE_ENV === 'production' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                      {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Code className="h-4 w-4" />
                      Framework
                    </span>
                    <span>Next.js 15</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Database className="h-4 w-4" />
                      Banco de Dados
                    </span>
                    <span>PostgreSQL</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Desenvolvido por</span>
                    <span className="font-medium">Eduardo Vargas</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Autenticação</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      NextAuth.js
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Headers de Segurança</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configurados
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Rate Limiting</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Validação de Dados</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Zod
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Criptografia de Senhas</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      bcrypt
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Funcionalidades do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { nome: 'Dashboard', icon: BarChart3, ativo: true },
                      { nome: 'Funcionários', icon: Users, ativo: true },
                      { nome: 'Condomínios', icon: Building2, ativo: true },
                      { nome: 'Empreitadas', icon: Briefcase, ativo: true },
                      { nome: 'Retiradas', icon: DollarSign, ativo: true },
                      { nome: 'Ferramentas', icon: Wrench, ativo: true },
                      { nome: 'Contratos', icon: FileText, ativo: true },
                      { nome: 'Relatórios PDF', icon: FileText, ativo: true },
                    ].map((func, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                        <func.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{func.nome}</span>
                        {func.ativo && (
                          <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Editar Usuário */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome Completo</Label>
                <Input
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-login">Login</Label>
                <Input
                  id="edit-login"
                  value={editFormData.login}
                  onChange={(e) => setEditFormData({ ...editFormData, login: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-senha">Nova Senha (deixe em branco para manter)</Label>
                <Input
                  id="edit-senha"
                  type="password"
                  placeholder="Nova senha"
                  value={editFormData.senha}
                  onChange={(e) => setEditFormData({ ...editFormData, senha: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-admin"
                    checked={editFormData.admin}
                    onChange={(e) => setEditFormData({ ...editFormData, admin: e.target.checked })}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="edit-admin">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-ativo"
                    checked={editFormData.ativo}
                    onChange={(e) => setEditFormData({ ...editFormData, ativo: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="edit-ativo">Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
