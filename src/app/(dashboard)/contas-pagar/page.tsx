'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
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
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileUp,
  Loader2,
  DollarSign,
} from 'lucide-react'
import type { ContaPagar, StatusConta } from '@/types'

export default function ContasPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusConta | 'todas'>('todas')

  useEffect(() => {
    async function fetchContas() {
      try {
        const response = await fetch('/api/contas-pagar')
        const result = await response.json()
        if (result.success && result.data) {
          setContas(result.data)
        }
      } catch (error) {
        console.error('Erro ao buscar contas a pagar:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchContas()
  }, [])

  const filteredContas = contas.filter((c) => {
    if (activeTab === 'todas') return true
    return c.status === activeTab
  })

  // Stats
  const hoje = new Date().toISOString().split('T')[0]
  const stats = {
    pendentes: contas.filter((c) => c.status === 'Pendente').length,
    atrasadas: contas.filter((c) => c.status === 'Atrasado').length,
    pagas: contas.filter((c) => c.status === 'Pago').length,
    total_pendente: contas
      .filter((c) => c.status === 'Pendente' || c.status === 'Atrasado')
      .reduce((acc, c) => acc + c.valor, 0),
    vencendo_hoje: contas.filter((c) => c.data_vencimento === hoje && c.status === 'Pendente').length,
    valor_atrasado: contas
      .filter((c) => c.status === 'Atrasado')
      .reduce((acc, c) => acc + c.valor, 0),
  }

  const columns: ColumnDef<ContaPagar>[] = [
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.descricao}</p>
          {row.original.fornecedor && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {row.original.fornecedor.nome}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.valor)}</span>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.categoria || 'Outros'}
        </Badge>
      ),
    },
    {
      accessorKey: 'data_vencimento',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Vencimento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.original.data_vencimento)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary" className={statusColors[row.original.status]}>
          {row.original.status === 'Pago' && <CheckCircle className="h-3 w-3 mr-1" />}
          {row.original.status === 'Atrasado' && <AlertCircle className="h-3 w-3 mr-1" />}
          {row.original.status === 'Pendente' && <Clock className="h-3 w-3 mr-1" />}
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const conta = row.original
        const isPendente = conta.status === 'Pendente' || conta.status === 'Atrasado'

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
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {isPendente && (
                <DropdownMenuItem>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como pago
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
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
      <Header title="Contas a Pagar" description="Gerencie as contas e pagamentos" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Pendente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(stats.total_pendente)}</p>
              <p className="text-xs text-muted-foreground">{stats.pendentes} conta(s)</p>
            </CardContent>
          </Card>

          <Card className={stats.atrasadas > 0 ? 'bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atrasadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stats.atrasadas > 0 ? 'text-red-500' : ''}`}>
                {formatCurrency(stats.valor_atrasado)}
              </p>
              <p className="text-xs text-muted-foreground">{stats.atrasadas} conta(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Vencendo Hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.vencendo_hoje}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pagas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">{stats.pagas}</p>
            </CardContent>
          </Card>
        </div>

        <PageHeader
          title="Contas a Pagar"
          description={`${contas.length} conta(s) cadastrada(s)`}
        >
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            Importar XML
          </Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </PageHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="todas">
              Todas ({contas.length})
            </TabsTrigger>
            <TabsTrigger value="Pendente">
              Pendentes ({stats.pendentes})
            </TabsTrigger>
            <TabsTrigger value="Atrasado">
              Atrasadas ({stats.atrasadas})
            </TabsTrigger>
            <TabsTrigger value="Pago">
              Pagas ({stats.pagas})
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
            data={filteredContas}
            searchKey="descricao"
            searchPlaceholder="Buscar conta..."
          />
        )}
      </div>
    </>
  )
}
