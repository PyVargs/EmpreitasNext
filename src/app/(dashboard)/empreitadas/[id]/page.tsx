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
  DollarSign,
  Edit,
  Loader2,
  Plus,
  Trash2,
  User,
  CheckCircle,
  RotateCcw,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

interface Retirada {
  id: string
  valor: number
  data: string
  descricao?: string
}

interface Empreitada {
  id: string
  nome: string
  descricao?: string
  valor_total: number
  total_retirado: number
  saldo: number
  concluida: boolean
  data?: string
  data_conclusao?: string
  funcionario?: { id: string; nome: string }
  condominio?: { id: string; nome: string }
  retiradas: Retirada[]
}

export default function EmpreitadaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [empreitada, setEmpreitada] = useState<Empreitada | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modais
  const [modalNovaRetirada, setModalNovaRetirada] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalConcluir, setModalConcluir] = useState(false)
  const [modalExcluirRetirada, setModalExcluirRetirada] = useState<string | null>(null)
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')

  // Form de retirada
  const [formRetirada, setFormRetirada] = useState({
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  })

  // Form de edição
  const [formEditar, setFormEditar] = useState({
    nome: '',
    valorTotal: '',
    descricao: '',
  })

  useEffect(() => {
    fetchEmpreitada()
  }, [id])

  async function fetchEmpreitada() {
    try {
      const res = await fetch(`/api/empreitadas/${id}`)
      const data = await res.json()

      if (data.success) {
        setEmpreitada(data.data)
        setFormEditar({
          nome: data.data.nome,
          valorTotal: data.data.valor_total.toString(),
          descricao: data.data.descricao || '',
        })
      } else {
        toast.error('Empreitada não encontrada')
        router.push('/empreitadas')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar empreitada')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos
  const percentualUsado = useMemo(() => {
    if (!empreitada || empreitada.valor_total === 0) return 0
    return (empreitada.total_retirado / empreitada.valor_total) * 100
  }, [empreitada])

  // Nova retirada
  async function handleNovaRetirada(e: React.FormEvent) {
    e.preventDefault()
    if (!empreitada) return

    setSaving(true)
    try {
      const res = await fetch('/api/retiradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empreitadaId: empreitada.id,
          funcionarioId: empreitada.funcionario?.id,
          valor: parseFloat(formRetirada.valor),
          descricao: formRetirada.descricao,
          data: formRetirada.data,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Retirada registrada com sucesso!')
        setModalNovaRetirada(false)
        setFormRetirada({ valor: '', descricao: '', data: new Date().toISOString().split('T')[0] })
        fetchEmpreitada()
      } else {
        toast.error(data.error || 'Erro ao registrar retirada')
      }
    } catch {
      toast.error('Erro ao registrar retirada')
    } finally {
      setSaving(false)
    }
  }

  // Editar empreitada
  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!empreitada) return

    // Verificar senha
    if (senhaConfirmacao !== 'vbs151481') {
      toast.error('Senha incorreta')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/empreitadas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formEditar.nome,
          valorTotal: parseFloat(formEditar.valorTotal),
          descricao: formEditar.descricao,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Empreitada atualizada com sucesso!')
        setModalEditar(false)
        setSenhaConfirmacao('')
        fetchEmpreitada()
      } else {
        toast.error(data.error || 'Erro ao atualizar empreitada')
      }
    } catch {
      toast.error('Erro ao atualizar empreitada')
    } finally {
      setSaving(false)
    }
  }

  // Concluir/Reativar empreitada
  async function handleConcluir() {
    if (!empreitada) return

    setSaving(true)
    try {
      const res = await fetch(`/api/empreitadas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concluida: !empreitada.concluida,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(empreitada.concluida ? 'Empreitada reativada!' : 'Empreitada concluída!')
        setModalConcluir(false)
        fetchEmpreitada()
      } else {
        toast.error(data.error || 'Erro ao atualizar empreitada')
      }
    } catch {
      toast.error('Erro ao atualizar empreitada')
    } finally {
      setSaving(false)
    }
  }

  // Excluir retirada
  async function handleExcluirRetirada() {
    if (!modalExcluirRetirada) return

    // Verificar senha
    if (senhaConfirmacao !== 'vbs151481') {
      toast.error('Senha incorreta')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/retiradas/${modalExcluirRetirada}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Retirada excluída com sucesso!')
        setModalExcluirRetirada(null)
        setSenhaConfirmacao('')
        fetchEmpreitada()
      } else {
        toast.error(data.error || 'Erro ao excluir retirada')
      }
    } catch {
      toast.error('Erro ao excluir retirada')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Carregando..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </>
    )
  }

  if (!empreitada) {
    return (
      <>
        <Header title="Não encontrada" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Empreitada não encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/empreitadas">Voltar</Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={empreitada.nome} description={empreitada.condominio?.nome || ''} />

      <div className="p-6 space-y-6">
        {/* Breadcrumb e Ações */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/empreitadas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Empreitadas
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setModalEditar(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant={empreitada.concluida ? 'outline' : 'default'}
              onClick={() => setModalConcluir(true)}
              className={!empreitada.concluida ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {empreitada.concluida ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reativar
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir
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
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Valor Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(empreitada.valor_total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500" />
                Total Retirado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">
                {formatCurrency(empreitada.total_retirado)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-500" />
                Saldo Restante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${empreitada.saldo >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                {formatCurrency(empreitada.saldo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Progresso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={Math.min(percentualUsado, 100)} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {percentualUsado.toFixed(1)}% utilizado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <User className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funcionário</p>
                  <Link
                    href={`/funcionarios/${empreitada.funcionario?.id}`}
                    className="font-medium hover:text-amber-500 transition-colors"
                  >
                    {empreitada.funcionario?.nome || 'N/A'}
                  </Link>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condomínio</p>
                  <p className="font-medium">{empreitada.condominio?.nome || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Início</p>
                  <p className="font-medium">{empreitada.data ? formatDate(empreitada.data) : 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${empreitada.concluida ? 'bg-emerald-500/10' : 'bg-cyan-500/10'}`}>
                  <FileText className={`h-5 w-5 ${empreitada.concluida ? 'text-emerald-500' : 'text-cyan-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={empreitada.concluida ? statusColors.concluida : statusColors.ativa}>
                    {empreitada.concluida ? 'Concluída' : 'Ativa'}
                  </Badge>
                  {empreitada.data_conclusao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Concluída em {formatDate(empreitada.data_conclusao)}
                    </p>
                  )}
                </div>
              </div>

              {empreitada.descricao && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm">{empreitada.descricao}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Retiradas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Retiradas</CardTitle>
                <CardDescription>
                  {empreitada.retiradas.length} retirada(s) registrada(s)
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setModalNovaRetirada(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={empreitada.concluida}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Retirada
              </Button>
            </CardHeader>
            <CardContent>
              {empreitada.retiradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma retirada registrada
                </p>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empreitada.retiradas.map((ret) => (
                        <TableRow key={ret.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(ret.data)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {ret.descricao || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-500">
                            {formatCurrency(ret.valor)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => setModalExcluirRetirada(ret.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Nova Retirada */}
      <Dialog open={modalNovaRetirada} onOpenChange={setModalNovaRetirada}>
        <DialogContent>
          <form onSubmit={handleNovaRetirada}>
            <DialogHeader>
              <DialogTitle>Nova Retirada</DialogTitle>
              <DialogDescription>
                Registre uma nova retirada para esta empreitada.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formRetirada.valor}
                  onChange={(e) => setFormRetirada({ ...formRetirada, valor: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formRetirada.data}
                  onChange={(e) => setFormRetirada({ ...formRetirada, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da retirada..."
                  value={formRetirada.descricao}
                  onChange={(e) => setFormRetirada({ ...formRetirada, descricao: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalNovaRetirada(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={modalEditar} onOpenChange={(open) => { setModalEditar(open); setSenhaConfirmacao('') }}>
        <DialogContent>
          <form onSubmit={handleEditar}>
            <DialogHeader>
              <DialogTitle>Editar Empreitada</DialogTitle>
              <DialogDescription>
                Altere os dados da empreitada. Informe a senha para confirmar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formEditar.nome}
                  onChange={(e) => setFormEditar({ ...formEditar, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valor">Valor Total *</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formEditar.valorTotal}
                  onChange={(e) => setFormEditar({ ...formEditar, valorTotal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formEditar.descricao}
                  onChange={(e) => setFormEditar({ ...formEditar, descricao: e.target.value })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="senha">Senha de Confirmação *</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite a senha"
                  value={senhaConfirmacao}
                  onChange={(e) => setSenhaConfirmacao(e.target.value)}
                  required
                />
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

      {/* Modal Concluir/Reativar */}
      <AlertDialog open={modalConcluir} onOpenChange={setModalConcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {empreitada.concluida ? 'Reativar Empreitada?' : 'Concluir Empreitada?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {empreitada.concluida
                ? 'A empreitada voltará a aparecer como ativa e poderá receber novas retiradas.'
                : 'A empreitada será marcada como concluída. Você poderá reativá-la depois se necessário.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConcluir}
              disabled={saving}
              className={empreitada.concluida ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Excluir Retirada */}
      <Dialog open={!!modalExcluirRetirada} onOpenChange={(open) => { if (!open) { setModalExcluirRetirada(null); setSenhaConfirmacao('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Excluir Retirada</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Digite a senha para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="senha-excluir">Senha de Confirmação *</Label>
              <Input
                id="senha-excluir"
                type="password"
                placeholder="Digite a senha"
                value={senhaConfirmacao}
                onChange={(e) => setSenhaConfirmacao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalExcluirRetirada(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleExcluirRetirada}
              disabled={saving || !senhaConfirmacao}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
