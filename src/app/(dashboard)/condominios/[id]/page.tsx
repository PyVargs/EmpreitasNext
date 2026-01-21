'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate, statusColors } from '@/lib/constants'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Briefcase,
  Wrench,
  DollarSign,
  TrendingUp,
  Eye,
  MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'

interface Empreitada {
  id: string
  nome: string
  valor_total: number
  total_retirado: number
  saldo: number
  concluida: boolean
  data?: string
  funcionario?: { id: number; nome: string }
}

interface Contrato {
  id: string
  nome_servico: string
  valor_total: number
  data_inicio: string
  data_fim?: string
  status?: string
}

interface Ferramenta {
  id: string
  codigo: string
  nome: string
  localizacao?: string
  funcionario?: string
}

interface Stats {
  total_empreitadas: number
  empreitadas_ativas: number
  total_contratos: number
  total_ferramentas: number
  valor_empreitadas: number
  valor_retirado: number
}

interface Condominio {
  id: string
  nome: string
  cnpj: string
  endereco: string
  sindico: string
  telefone?: string
  email?: string
  ativo: boolean
  data_criacao?: string
  empreitadas: Empreitada[]
  contratos: Contrato[]
  ferramentas: Ferramenta[]
  stats: Stats
}

export default function CondominioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [condominio, setCondominio] = useState<Condominio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modais
  const [modalEditar, setModalEditar] = useState(false)
  const [modalDesativar, setModalDesativar] = useState(false)

  // Form de edição
  const [formEditar, setFormEditar] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    sindico: '',
    telefone: '',
    email: '',
  })

  useEffect(() => {
    fetchCondominio()
  }, [id])

  async function fetchCondominio() {
    try {
      const res = await fetch(`/api/condominios/${id}`)
      const data = await res.json()

      if (data.success) {
        setCondominio(data.data)
        setFormEditar({
          nome: data.data.nome,
          cnpj: data.data.cnpj,
          endereco: data.data.endereco,
          sindico: data.data.sindico,
          telefone: data.data.telefone || '',
          email: data.data.email || '',
        })
      } else {
        toast.error('Condomínio não encontrado')
        router.push('/condominios')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar condomínio')
    } finally {
      setLoading(false)
    }
  }

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  // Formatação de telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14)
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  // Editar condomínio
  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!condominio) return

    setSaving(true)
    try {
      const res = await fetch(`/api/condominios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formEditar),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Condomínio atualizado com sucesso!')
        setModalEditar(false)
        fetchCondominio()
      } else {
        toast.error(data.error || 'Erro ao atualizar condomínio')
      }
    } catch {
      toast.error('Erro ao atualizar condomínio')
    } finally {
      setSaving(false)
    }
  }

  // Desativar/Ativar condomínio
  async function handleToggleAtivo() {
    if (!condominio) return

    setSaving(true)
    try {
      const res = await fetch(`/api/condominios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !condominio.ativo }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(condominio.ativo ? 'Condomínio desativado!' : 'Condomínio ativado!')
        setModalDesativar(false)
        fetchCondominio()
      } else {
        toast.error(data.error || 'Erro ao atualizar condomínio')
      }
    } catch {
      toast.error('Erro ao atualizar condomínio')
    } finally {
      setSaving(false)
    }
  }

  // Calcular saldo total
  const saldoTotal = useMemo(() => {
    if (!condominio) return 0
    return condominio.stats.valor_empreitadas - condominio.stats.valor_retirado
  }, [condominio])

  if (loading) {
    return (
      <>
        <Header title="Carregando..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </>
    )
  }

  if (!condominio) {
    return (
      <>
        <Header title="Não encontrado" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Condomínio não encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/condominios">Voltar</Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={condominio.nome} description={condominio.endereco} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb e Ações */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/condominios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Condomínios
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setModalEditar(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant={condominio.ativo ? 'destructive' : 'default'}
              onClick={() => setModalDesativar(true)}
            >
              {condominio.ativo ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-500" />
                Empreitadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{condominio.stats.total_empreitadas}</p>
              <p className="text-xs text-muted-foreground">
                {condominio.stats.empreitadas_ativas} ativa(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Valor Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(condominio.stats.valor_empreitadas)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-500" />
                Saldo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                {formatCurrency(saldoTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-500" />
                Ferramentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-500">{condominio.stats.total_ferramentas}</p>
            </CardContent>
          </Card>
        </div>

        {/* Informações + Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Condomínio */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informações</CardTitle>
                <Badge
                  className={condominio.ativo 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-red-500/10 text-red-500'}
                >
                  {condominio.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{condominio.cnpj}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <User className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Síndico</p>
                  <p className="font-medium">{condominio.sindico}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-sm">{condominio.endereco}</p>
                </div>
              </div>

              {condominio.telefone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Phone className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{condominio.telefone}</p>
                    </div>
                  </div>
                </>
              )}

              {condominio.email && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Mail className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium text-sm">{condominio.email}</p>
                    </div>
                  </div>
                </>
              )}

              {condominio.data_criacao && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-500/10">
                      <Calendar className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cadastrado em</p>
                      <p className="font-medium">{formatDate(condominio.data_criacao)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs com Empreitadas, Contratos e Ferramentas */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="empreitadas">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="empreitadas" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Empreitadas ({condominio.empreitadas.length})
                  </TabsTrigger>
                  <TabsTrigger value="contratos" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contratos ({condominio.contratos.length})
                  </TabsTrigger>
                  <TabsTrigger value="ferramentas" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Ferramentas ({condominio.ferramentas.length})
                  </TabsTrigger>
                </TabsList>

                {/* Empreitadas */}
                <TabsContent value="empreitadas" className="mt-4">
                  {condominio.empreitadas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma empreitada vinculada
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empreitada</TableHead>
                            <TableHead>Funcionário</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {condominio.empreitadas.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell className="font-medium">{emp.nome}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {emp.funcionario?.nome || '-'}
                              </TableCell>
                              <TableCell className="text-right text-emerald-500">
                                {formatCurrency(emp.valor_total)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${emp.saldo >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                                {formatCurrency(emp.saldo)}
                              </TableCell>
                              <TableCell>
                                <Badge className={emp.concluida ? statusColors.concluida : statusColors.ativa}>
                                  {emp.concluida ? 'Concluída' : 'Ativa'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/empreitadas/${emp.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Contratos */}
                <TabsContent value="contratos" className="mt-4">
                  {condominio.contratos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum contrato vinculado
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Fim</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {condominio.contratos.map((contrato) => (
                            <TableRow key={contrato.id}>
                              <TableCell className="font-medium">{contrato.nome_servico}</TableCell>
                              <TableCell className="text-right text-emerald-500">
                                {formatCurrency(contrato.valor_total)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(contrato.data_inicio)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {contrato.data_fim ? formatDate(contrato.data_fim) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {contrato.status || 'Ativo'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Ferramentas */}
                <TabsContent value="ferramentas" className="mt-4">
                  {condominio.ferramentas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma ferramenta neste condomínio
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Com</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {condominio.ferramentas.map((ferramenta) => (
                            <TableRow key={ferramenta.id}>
                              <TableCell className="font-mono text-sm">{ferramenta.codigo}</TableCell>
                              <TableCell className="font-medium">{ferramenta.nome}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{ferramenta.localizacao || 'CD'}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {ferramenta.funcionario || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Editar */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleEditar}>
            <DialogHeader>
              <DialogTitle>Editar Condomínio</DialogTitle>
              <DialogDescription>
                Altere os dados do condomínio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-nome">Nome *</Label>
                  <Input
                    id="edit-nome"
                    value={formEditar.nome}
                    onChange={(e) => setFormEditar({ ...formEditar, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cnpj">CNPJ *</Label>
                  <Input
                    id="edit-cnpj"
                    value={formEditar.cnpj}
                    onChange={(e) => setFormEditar({ ...formEditar, cnpj: formatCNPJ(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sindico">Síndico *</Label>
                  <Input
                    id="edit-sindico"
                    value={formEditar.sindico}
                    onChange={(e) => setFormEditar({ ...formEditar, sindico: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endereco">Endereço *</Label>
                <Textarea
                  id="edit-endereco"
                  value={formEditar.endereco}
                  onChange={(e) => setFormEditar({ ...formEditar, endereco: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={formEditar.telefone}
                    onChange={(e) => setFormEditar({ ...formEditar, telefone: formatTelefone(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formEditar.email}
                    onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalEditar(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Desativar/Ativar */}
      <AlertDialog open={modalDesativar} onOpenChange={setModalDesativar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {condominio.ativo ? 'Desativar Condomínio?' : 'Ativar Condomínio?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {condominio.ativo
                ? 'O condomínio será marcado como inativo e não aparecerá nas listagens padrão.'
                : 'O condomínio será reativado e voltará a aparecer nas listagens.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAtivo}
              disabled={saving}
              className={condominio.ativo ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
