'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import { formatCurrency, statusColors, statusLabels } from '@/lib/constants'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  ArrowUpDown,
  FileText,
  Building2,
  AlertCircle,
  Clock,
  DollarSign,
  Loader2,
  Calculator,
  BarChart3,
} from 'lucide-react'
import type { Contrato, StatusContrato } from '@/types'

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusContrato | 'todos'>('todos')

  useEffect(() => {
    async function fetchContratos() {
      try {
        const response = await fetch('/api/contratos')
        const result = await response.json()
        if (result.success && result.data) {
          setContratos(result.data)
        }
      } catch (error) {
        console.error('Erro ao buscar contratos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchContratos()
  }, [])

  const filteredContratos = contratos.filter((c) => {
    if (activeTab === 'todos') return true
    return c.status === activeTab
  })

  // Stats
  const stats = {
    ativos: contratos.filter((c) => c.status === 'ativo').length,
    finalizados: contratos.filter((c) => c.status === 'finalizado').length,
    valor_total: contratos.reduce((acc, c) => acc + c.valor_total, 0),
    valor_pago: contratos.reduce((acc, c) => acc + (c.valor_pago || 0), 0),
    valor_pendente: contratos.reduce((acc, c) => acc + (c.valor_pendente || 0), 0),
    parcelas_vencidas: contratos.reduce((acc, c) => acc + (c.parcelas_vencidas || 0), 0),
  }

  const columns: ColumnDef<Contrato>[] = [
    {
      accessorKey: 'nome_servico',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Contrato
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nome_servico}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {row.original.condominio?.nome}
          </div>
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
        <span className="font-semibold">{formatCurrency(row.original.valor_total)}</span>
      ),
    },
    {
      accessorKey: 'tipo_pagamento',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {statusLabels[row.original.tipo_pagamento]}
        </Badge>
      ),
    },
    {
      accessorKey: 'progresso',
      header: 'Progresso',
      cell: ({ row }) => {
        const percentual = row.original.percentual_pago || 0
        return (
          <div className="w-32 space-y-1">
            <Progress value={percentual} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{percentual.toFixed(0)}%</span>
              <span className="text-emerald-500">
                {formatCurrency(row.original.valor_pago || 0)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'parcelas',
      header: 'Parcelas',
      cell: ({ row }) => {
        if (row.original.tipo_pagamento === 'medicoes') {
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.percentual_obra_executada || 0}% executado
            </span>
          )
        }
        const vencidas = row.original.parcelas_vencidas || 0
        return (
          <div className="space-y-1">
            <span className="text-sm">
              {row.original.parcelas_pagas}/{(row.original.parcelas_pagas || 0) + (row.original.parcelas_pendentes || 0)}
            </span>
            {vencidas > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {vencidas} vencida(s)
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary" className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const contrato = row.original

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
                <Link href={`/contratos/${contrato.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="mr-2 h-4 w-4" />
                Registrar pagamento
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calculator className="mr-2 h-4 w-4" />
                Calculadora NF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Gerar relatório
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <Header title="Contratos" description="Gerencie os contratos com condomínios" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Recebido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(stats.valor_pago)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(stats.valor_pendente)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contratos Ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{stats.ativos}</p>
            </CardContent>
          </Card>

          <Card className={stats.parcelas_vencidas > 0 ? 'bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Parcelas Vencidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stats.parcelas_vencidas > 0 ? 'text-red-500' : ''}`}>
                {stats.parcelas_vencidas}
              </p>
            </CardContent>
          </Card>
        </div>

        <PageHeader
          title="Contratos"
          description={`${contratos.length} contrato(s) • ${formatCurrency(stats.valor_total)} em contratos`}
        >
          <Button variant="outline" asChild>
            <Link href="/contratos/dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" asChild>
            <Link href="/contratos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Link>
          </Button>
        </PageHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="todos">
              Todos ({contratos.length})
            </TabsTrigger>
            <TabsTrigger value="ativo">
              Ativos ({stats.ativos})
            </TabsTrigger>
            <TabsTrigger value="finalizado">
              Finalizados ({stats.finalizados})
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
            data={filteredContratos}
            searchKey="nome_servico"
            searchPlaceholder="Buscar contrato..."
          />
        )}
      </div>
    </>
  )
}
