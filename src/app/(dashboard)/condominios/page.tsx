'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
  FileText,
  Wrench,
  Briefcase,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Condominio {
  id: string
  nome: string
  cnpj: string
  endereco: string
  sindico: string
  telefone?: string
  email?: string
  ativo: boolean
  total_empreitadas?: number
  total_contratos?: number
  total_ferramentas?: number
}

export default function CondominiosPage() {
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    sindico: '',
    telefone: '',
    email: '',
  })

  useEffect(() => {
    fetchCondominios()
  }, [])

  async function fetchCondominios() {
    try {
      const res = await fetch('/api/condominios?includeStats=true')
      const data = await res.json()

      if (data.success) {
        setCondominios(data.data)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar condomínios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/condominios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setCondominios([data.data, ...condominios])
        setDialogOpen(false)
        setFormData({ nome: '', cnpj: '', endereco: '', sindico: '', telefone: '', email: '' })
        toast.success('Condomínio cadastrado com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao cadastrar condomínio')
      }
    } catch {
      toast.error('Erro ao cadastrar condomínio')
    } finally {
      setSaving(false)
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

  const filteredCondominios = useMemo(() => {
    return condominios.filter((cond) => {
      if (activeTab === 'ativos') return cond.ativo
      if (activeTab === 'inativos') return !cond.ativo
      return true
    })
  }, [condominios, activeTab])

  // Estatísticas
  const stats = useMemo(() => ({
    total: condominios.length,
    ativos: condominios.filter(c => c.ativo).length,
    inativos: condominios.filter(c => !c.ativo).length,
  }), [condominios])

  const columns: ColumnDef<Condominio>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Condomínio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{row.original.nome}</p>
            <p className="text-xs text-muted-foreground">{row.original.cnpj}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'sindico',
      header: 'Síndico',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="truncate max-w-[150px]">{row.original.sindico}</span>
        </div>
      ),
    },
    {
      accessorKey: 'endereco',
      header: 'Endereço',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-sm">{row.original.endereco}</span>
        </div>
      ),
    },
    {
      accessorKey: 'contato',
      header: 'Contato',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.telefone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{row.original.telefone}</span>
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[150px]">{row.original.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.ativo 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-500 border-red-500/20'}
        >
          {row.original.ativo ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inativo
            </>
          )}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const condominio = row.original

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
                <Link href={`/condominios/${condominio.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Briefcase className="mr-2 h-4 w-4" />
                Empreitadas
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Contratos
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wrench className="mr-2 h-4 w-4" />
                Ferramentas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Desativar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <Header title="Condomínios" description="Gerencie todos os condomínios" />

      <div className="p-6">
        <PageHeader
          title="Gestão de Condomínios"
          description="Gerencie todos os condomínios e suas informações"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="mr-2 h-4 w-4" />
                Novo Condomínio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Condomínio</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo condomínio. Campos com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="nome">Nome do Condomínio *</Label>
                      <Input
                        id="nome"
                        placeholder="Ex: Condomínio Edifício Central"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sindico">Síndico *</Label>
                      <Input
                        id="sindico"
                        placeholder="Nome do síndico"
                        value={formData.sindico}
                        onChange={(e) => setFormData({ ...formData, sindico: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Textarea
                      id="endereco"
                      placeholder="Endereço completo do condomínio"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@condominio.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
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
                      'Cadastrar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                Total de Condomínios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Condomínios Ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-500">{stats.ativos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Condomínios Inativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{stats.inativos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="todos">
              Todos ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="ativos">
              Ativos ({stats.ativos})
            </TabsTrigger>
            <TabsTrigger value="inativos">
              Inativos ({stats.inativos})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCondominios}
            searchKey="nome"
            searchPlaceholder="Buscar condomínio..."
          />
        )}
      </div>
    </>
  )
}
