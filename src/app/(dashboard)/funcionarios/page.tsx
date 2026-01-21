'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatPhone } from '@/lib/constants'
import { Plus, MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, Phone, FileText, Loader2, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

interface Funcionario {
  id: string
  nome: string
  telefone?: string | null
  cpf?: string | null
  rg?: string | null
  endereco?: string | null
  ativo: boolean
  total_empreitadas: number
  total_retirado: number
  saldo: number
  empreitadas_ativas?: number
}

interface CreateFuncionarioDTO {
  nome: string
  telefone?: string
  cpf?: string
  rg?: string
  endereco?: string
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateFuncionarioDTO>({
    nome: '',
    telefone: '',
    cpf: '',
    rg: '',
    endereco: '',
  })

  useEffect(() => {
    fetchFuncionarios()
  }, [])

  async function fetchFuncionarios() {
    try {
      const response = await fetch('/api/funcionarios')
      const data = await response.json()
      
      if (data.success) {
        setFuncionarios(data.data)
      } else {
        toast.error('Erro ao carregar funcionários')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFuncionarios([data.data, ...funcionarios])
        setDialogOpen(false)
        setFormData({ nome: '', telefone: '', cpf: '', rg: '', endereco: '' })
        toast.success('Funcionário cadastrado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao cadastrar funcionário')
      }
    } catch {
      toast.error('Erro ao cadastrar funcionário')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<Funcionario>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nome}</p>
          {row.original.telefone && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {formatPhone(row.original.telefone)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'empreitadas_ativas',
      header: 'Empreitadas',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.empreitadas_ativas || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: 'total_empreitadas',
      header: 'Total Empreitadas',
      cell: ({ row }) => (
        <span className="font-medium text-emerald-500">
          {formatCurrency(row.original.total_empreitadas || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'total_retirado',
      header: 'Total Retirado',
      cell: ({ row }) => (
        <span className="text-amber-500">
          {formatCurrency(row.original.total_retirado || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'saldo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Saldo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const saldo = row.original.saldo || 0
        return (
          <span className={saldo > 0 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
            {formatCurrency(saldo)}
          </span>
        )
      },
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.ativo
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }
        >
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const funcionario = row.original

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
                <Link href={`/funcionarios/${funcionario.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
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

  return (
    <>
      <Header title="Funcionários" description="Gerencie os funcionários da empresa" />
      
      <div className="p-6">
        <PageHeader
          title="Funcionários"
          description={`${funcionarios.length} funcionário(s) cadastrado(s)`}
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do funcionário. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      placeholder="Nome completo"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        placeholder="11999887766"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      placeholder="00.000.000-0"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Textarea
                      id="endereco"
                      placeholder="Rua, número, bairro, cidade"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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
                      'Salvar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={funcionarios}
            searchKey="nome"
            searchPlaceholder="Buscar funcionário..."
          />
        )}
      </div>
    </>
  )
}
