'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatDate, statusColors } from '@/lib/constants'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  DollarSign,
  CheckCircle,
  RotateCcw,
  FileText,
  Loader2,
  Building2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

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
  total_retiradas?: number
}

interface Funcionario {
  id: string
  nome: string
}

interface Condominio {
  id: string
  nome: string
}

export default function EmpreitadasPage() {
  const [empreitadas, setEmpreitadas] = useState<Empreitada[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'todas' | 'ativas' | 'concluidas'>('todas')
  const [formData, setFormData] = useState({
    nome: '',
    valor_total: 0,
    descricao: '',
    funcionario_id: '',
    condominio_id: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [empRes, funcRes, condRes] = await Promise.all([
        fetch('/api/empreitadas'),
        fetch('/api/funcionarios'),
        fetch('/api/condominios'),
      ])

      const [empData, funcData, condData] = await Promise.all([
        empRes.json(),
        funcRes.json(),
        condRes.json(),
      ])

      if (empData.success) setEmpreitadas(empData.data)
      if (funcData.success) setFuncionarios(funcData.data)
      if (condData.success) setCondominios(condData.data)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/empreitadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setEmpreitadas([data.data, ...empreitadas])
        setDialogOpen(false)
        setFormData({ nome: '', valor_total: 0, descricao: '', funcionario_id: '', condominio_id: '' })
        toast.success('Empreitada criada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao criar empreitada')
      }
    } catch {
      toast.error('Erro ao criar empreitada')
    } finally {
      setSaving(false)
    }
  }

  const filteredEmpreitadas = empreitadas.filter((emp) => {
    if (activeTab === 'ativas') return !emp.concluida
    if (activeTab === 'concluidas') return emp.concluida
    return true
  })

  const columns: ColumnDef<Empreitada>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Empreitada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nome}</p>
          {row.original.condominio && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {row.original.condominio.nome}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'funcionario',
      header: 'Funcionário',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
            {row.original.funcionario?.nome?.charAt(0) || '?'}
          </div>
          <span className="truncate max-w-[120px]">{row.original.funcionario?.nome || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'valor_total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Valor Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-500">{formatCurrency(row.original.valor_total)}</span>
      ),
    },
    {
      accessorKey: 'total_retirado',
      header: 'Retirado',
      cell: ({ row }) => (
        <span className="text-amber-500">{formatCurrency(row.original.total_retirado)}</span>
      ),
    },
    {
      accessorKey: 'progresso',
      header: 'Saldo',
      cell: ({ row }) => {
        const percentual = row.original.valor_total > 0 
          ? (row.original.total_retirado / row.original.valor_total) * 100 
          : 0
        return (
          <div className="w-32 space-y-1">
            <Progress value={percentual} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{percentual.toFixed(0)}%</span>
              <span className={row.original.saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {formatCurrency(row.original.saldo)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'concluida',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.concluida ? statusColors.concluida : statusColors.ativa}
        >
          {row.original.concluida ? 'Concluída' : 'Ativa'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const empreitada = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/empreitadas/${empreitada.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="mr-2 h-4 w-4" />
                Nova retirada
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {empreitada.concluida ? (
                <DropdownMenuItem>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como concluída
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Gerar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Totais
  const totais = {
    valor: empreitadas.reduce((acc, e) => acc + e.valor_total, 0),
    retirado: empreitadas.reduce((acc, e) => acc + e.total_retirado, 0),
    saldo: empreitadas.reduce((acc, e) => acc + e.saldo, 0),
    ativas: empreitadas.filter((e) => !e.concluida).length,
    concluidas: empreitadas.filter((e) => e.concluida).length,
  }

  return (
    <>
      <Header title="Empreitadas" description="Gerencie as obras e serviços" />

      <div className="p-6">
        <PageHeader
          title="Empreitadas"
          description={`${totais.ativas} ativa(s), ${totais.concluidas} concluída(s) • Total: ${formatCurrency(totais.valor)}`}
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Nova Empreitada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nova Empreitada</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da empreitada. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Empreitada *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Reforma Bloco A"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_total">Valor Total *</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={formData.valor_total || ''}
                      onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funcionario_id">Funcionário *</Label>
                    <Select
                      value={formData.funcionario_id}
                      onValueChange={(value) => setFormData({ ...formData, funcionario_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((func) => (
                          <SelectItem key={func.id} value={func.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {func.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condominio_id">Condomínio *</Label>
                    <Select
                      value={formData.condominio_id}
                      onValueChange={(value) => setFormData({ ...formData, condominio_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o condomínio" />
                      </SelectTrigger>
                      <SelectContent>
                        {condominios.map((cond) => (
                          <SelectItem key={cond.id} value={cond.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {cond.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Detalhes sobre a empreitada..."
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
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
                        Salvando...
                      </>
                    ) : (
                      'Criar Empreitada'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="todas">
              Todas ({empreitadas.length})
            </TabsTrigger>
            <TabsTrigger value="ativas">
              Ativas ({totais.ativas})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({totais.concluidas})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredEmpreitadas}
            searchKey="nome"
            searchPlaceholder="Buscar empreitada..."
          />
        )}
      </div>
    </>
  )
}
