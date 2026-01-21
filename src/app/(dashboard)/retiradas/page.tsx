'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatDate } from '@/lib/constants'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  ArrowUpDown,
  History,
  User,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface Retirada {
  id: string
  valor: number
  data: string
  descricao: string | null
  funcionario_id: string
  empreitada_id: string
  funcionario: {
    id: string
    nome: string
  } | null
  empreitada: {
    id: string
    nome: string
    valor_total: number
    condominio: {
      id: string
      nome: string
    } | null
  } | null
  historico: HistoricoRetirada[]
  tem_historico: boolean
}

interface HistoricoRetirada {
  id: string
  campo_alterado: string
  valor_anterior: string | null
  valor_novo: string | null
  motivo: string | null
  data_alteracao: string
  usuario?: {
    id: string
    nome: string
  } | null
}

export default function RetiradasPage() {
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const [showHistorico, setShowHistorico] = useState(false)

  useEffect(() => {
    async function fetchRetiradas() {
      try {
        const response = await fetch('/api/retiradas')
        const result = await response.json()
        if (result.success && result.data) {
          setRetiradas(result.data)
        }
      } catch (error) {
        console.error('Erro ao buscar retiradas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRetiradas()
  }, [])

  const handleVerHistorico = async (retirada: Retirada) => {
    try {
      const response = await fetch(`/api/retiradas/${retirada.id}`)
      const result = await response.json()
      if (result.success && result.data) {
        setSelectedRetirada(result.data)
        setShowHistorico(true)
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    }
  }

  // Stats
  const stats = {
    total_retiradas: retiradas.length,
    valor_total: retiradas.reduce((acc, r) => acc + r.valor, 0),
    com_historico: retiradas.filter(r => r.tem_historico).length,
    funcionarios_unicos: new Set(retiradas.map(r => r.funcionario_id)).size,
  }

  const formatCampoAlterado = (campo: string) => {
    const labels: Record<string, string> = {
      valor: 'Valor',
      data: 'Data',
      descricao: 'Descrição',
      funcionario_id: 'Funcionário',
      empreitada_id: 'Empreitada',
    }
    return labels[campo] || campo
  }

  const formatValorHistorico = (campo: string, valor: string | null) => {
    if (!valor) return '-'
    if (campo === 'valor') {
      return formatCurrency(parseFloat(valor))
    }
    if (campo === 'data') {
      return formatDate(valor)
    }
    return valor
  }

  const columns: ColumnDef<Retirada>[] = [
    {
      accessorKey: 'funcionario',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Funcionário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.funcionario?.nome || 'N/A'}</p>
          {row.original.empreitada && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {row.original.empreitada.nome}
            </div>
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
        <span className="font-semibold text-amber-500">{formatCurrency(row.original.valor)}</span>
      ),
    },
    {
      accessorKey: 'data',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.original.data)}
        </div>
      ),
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.original.descricao || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'condominio',
      header: 'Condomínio',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.empreitada?.condominio?.nome || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'historico',
      header: 'Histórico',
      cell: ({ row }) => (
        row.original.tem_historico ? (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <History className="h-3 w-3 mr-1" />
            {row.original.historico.length} alteração(ões)
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const retirada = row.original

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
              <DropdownMenuItem onClick={() => handleVerHistorico(retirada)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {retirada.tem_historico && (
                <DropdownMenuItem onClick={() => handleVerHistorico(retirada)}>
                  <History className="mr-2 h-4 w-4" />
                  Ver histórico
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <Header title="Retiradas" description="Gerencie as retiradas dos funcionários" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Retirado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(stats.valor_total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total de Retiradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total_retiradas}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Com Alterações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{stats.com_historico}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.funcionarios_unicos}</p>
            </CardContent>
          </Card>
        </div>

        <PageHeader
          title="Retiradas"
          description={`${retiradas.length} retirada(s) registrada(s)`}
        >
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nova Retirada
          </Button>
        </PageHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={retiradas}
            searchKey="funcionario"
            searchPlaceholder="Buscar por funcionário..."
          />
        )}
      </div>

      {/* Modal de Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Detalhes da Retirada
            </DialogTitle>
            <DialogDescription>
              Informações e histórico de alterações
            </DialogDescription>
          </DialogHeader>

          {selectedRetirada && (
            <div className="space-y-6">
              {/* Dados da Retirada */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações Atuais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Funcionário</p>
                      <p className="font-medium">{selectedRetirada.funcionario?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-amber-500">{formatCurrency(selectedRetirada.valor)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium">{formatDate(selectedRetirada.data)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Empreitada</p>
                      <p className="font-medium">{selectedRetirada.empreitada?.nome}</p>
                    </div>
                  </div>
                  {selectedRetirada.descricao && (
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">{selectedRetirada.descricao}</p>
                    </div>
                  )}
                  {selectedRetirada.empreitada?.condominio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Condomínio</p>
                      <p className="font-medium">{selectedRetirada.empreitada.condominio.nome}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Alterações */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico de Alterações
                  </CardTitle>
                  <CardDescription>
                    Registro de todas as modificações realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedRetirada.historico && selectedRetirada.historico.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRetirada.historico.map((h, index) => (
                        <div
                          key={h.id}
                          className={`relative pl-6 pb-4 ${
                            index < selectedRetirada.historico.length - 1 ? 'border-l-2 border-muted' : ''
                          }`}
                        >
                          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="bg-background">
                                {formatCampoAlterado(h.campo_alterado)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(h.data_alteracao)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Valor Anterior</p>
                                <p className="font-medium text-red-400 line-through">
                                  {formatValorHistorico(h.campo_alterado, h.valor_anterior)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Novo Valor</p>
                                <p className="font-medium text-green-400">
                                  {formatValorHistorico(h.campo_alterado, h.valor_novo)}
                                </p>
                              </div>
                            </div>
                            {h.motivo && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground">Motivo:</p>
                                <p className="text-sm">{h.motivo}</p>
                              </div>
                            )}
                            {h.usuario && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                Por: {h.usuario.nome}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma alteração registrada para esta retirada.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
