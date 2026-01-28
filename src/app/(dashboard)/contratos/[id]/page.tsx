'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, statusColors, statusLabels } from '@/lib/constants'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  Target,
  TrendingUp,
  Percent,
  MapPin,
  Phone,
  Mail,
  User,
} from 'lucide-react'

interface Parcela {
  id: string
  numero_parcela: number
  valor_parcela: number
  valor_original?: number
  data_vencimento: string
  status: string
  data_pagamento?: string | null
  valor_pago?: number
  observacoes?: string
}

interface Medicao {
  id: string
  data_medicao: string
  area_executada?: number
  percentual_executado: number
  valor_medicao: number
  valor_pago?: number
  status_pagamento: string
  observacoes?: string
}

interface Condominio {
  id: string
  nome: string
  cnpj?: string
  endereco?: string
  sindico?: string
  telefone?: string
  email?: string
}

interface Contrato {
  id: string
  nome_servico: string
  valor_total: number
  valor_original?: number
  entrada_obra?: number
  area_total?: number
  tipo_pagamento: string
  data_inicio?: string
  data_fim?: string
  status: string
  observacoes?: string
  valor_pago: number
  valor_pendente: number
  parcelas_pagas: number
  parcelas_pendentes: number
  parcelas_vencidas: number
  percentual_pago: number
  percentual_obra_executada: number
  total_parcelas: number
  total_medicoes: number
  condominio?: Condominio | null
  parcelas: Parcela[]
  medicoes: Medicao[]
}

export default function ContratoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAcao, setLoadingAcao] = useState(false)
  
  // Modais
  const [modalPagamento, setModalPagamento] = useState(false)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [pagamentoData, setPagamentoData] = useState({
    valor_pago: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    observacoes: '',
  })

  useEffect(() => {
    fetchContrato()
  }, [resolvedParams.id])

  const fetchContrato = async () => {
    try {
      const response = await fetch(`/api/contratos/${resolvedParams.id}`)
      const result = await response.json()
      if (result.success && result.data) {
        setContrato(result.data)
      } else {
        toast.error('Contrato não encontrado')
        router.push('/contratos')
      }
    } catch (error) {
      console.error('Erro ao buscar contrato:', error)
      toast.error('Erro ao carregar contrato')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarPagamento = (parcela: Parcela) => {
    setParcelaSelecionada(parcela)
    setPagamentoData({
      valor_pago: parcela.valor_parcela.toString(),
      data_pagamento: new Date().toISOString().split('T')[0],
      observacoes: '',
    })
    setModalPagamento(true)
  }

  const handleConfirmarPagamento = async () => {
    if (!parcelaSelecionada) return
    setLoadingAcao(true)
    try {
      const response = await fetch(`/api/contratos/parcelas/${parcelaSelecionada.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_pago: parseFloat(pagamentoData.valor_pago),
          data_pagamento: pagamentoData.data_pagamento,
          observacoes: pagamentoData.observacoes,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Pagamento registrado com sucesso!')
        setModalPagamento(false)
        fetchContrato()
      } else {
        toast.error(result.error || 'Erro ao registrar pagamento')
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast.error('Erro ao registrar pagamento')
    } finally {
      setLoadingAcao(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'vencida':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Carregando..." />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </>
    )
  }

  if (!contrato) {
    return null
  }

  return (
    <>
      <Header 
        title={contrato.nome_servico} 
        description={`Contrato com ${contrato.condominio?.nome || 'N/A'}`} 
      />

      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/contratos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{contrato.nome_servico}</h1>
                <Badge variant="secondary" className={statusColors[contrato.status as keyof typeof statusColors]}>
                  {statusLabels[contrato.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4" />
                {contrato.condominio?.nome || 'Condomínio não informado'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(contrato.valor_total)}</p>
              {contrato.entrada_obra && contrato.entrada_obra > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Entrada: {formatCurrency(contrato.entrada_obra)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Valor Recebido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(contrato.valor_pago)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {contrato.percentual_pago.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Valor Pendente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(contrato.valor_pendente)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {contrato.parcelas_pendentes} parcela(s)
              </p>
            </CardContent>
          </Card>

          <Card className={contrato.parcelas_vencidas > 0 
            ? "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20" 
            : ""
          }>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Parcelas Vencidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${contrato.parcelas_vencidas > 0 ? 'text-red-500' : ''}`}>
                {contrato.parcelas_vencidas}
              </p>
              {contrato.parcelas_vencidas > 0 && (
                <p className="text-xs text-red-400 mt-1">Atenção necessária</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Progresso do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pagamento</span>
                <span className="font-medium">{contrato.percentual_pago.toFixed(1)}%</span>
              </div>
              <Progress value={contrato.percentual_pago} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(contrato.valor_pago)} recebido</span>
                <span>{formatCurrency(contrato.valor_pendente)} restante</span>
              </div>
            </div>

            {contrato.tipo_pagamento === 'medicoes' && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Obra Executada</span>
                  <span className="font-medium">{contrato.percentual_obra_executada}%</span>
                </div>
                <Progress value={contrato.percentual_obra_executada} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações do Contrato */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo de Pagamento</Label>
                  <p className="font-medium">
                    {statusLabels[contrato.tipo_pagamento as keyof typeof statusLabels] || contrato.tipo_pagamento}
                  </p>
                </div>
                {contrato.area_total && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Área Total</Label>
                    <p className="font-medium">{contrato.area_total.toLocaleString('pt-BR')} m²</p>
                  </div>
                )}
                {contrato.data_inicio && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Data de Início</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(contrato.data_inicio)}
                    </p>
                  </div>
                )}
                {contrato.data_fim && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Previsão de Término</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      {formatDate(contrato.data_fim)}
                    </p>
                  </div>
                )}
                {contrato.observacoes && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Observações</Label>
                    <p className="text-sm">{contrato.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Info do Condomínio */}
              {contrato.condominio && (
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Condomínio
                  </h4>
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome</Label>
                    <p className="font-medium">{contrato.condominio.nome}</p>
                  </div>
                  {contrato.condominio.cnpj && (
                    <div>
                      <Label className="text-muted-foreground text-xs">CNPJ</Label>
                      <p className="text-sm">{contrato.condominio.cnpj}</p>
                    </div>
                  )}
                  {contrato.condominio.endereco && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Endereço</Label>
                      <p className="text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        {contrato.condominio.endereco}
                      </p>
                    </div>
                  )}
                  {contrato.condominio.sindico && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Síndico</Label>
                      <p className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {contrato.condominio.sindico}
                      </p>
                    </div>
                  )}
                  {contrato.condominio.telefone && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Telefone</Label>
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {contrato.condominio.telefone}
                      </p>
                    </div>
                  )}
                  {contrato.condominio.email && (
                    <div>
                      <Label className="text-muted-foreground text-xs">E-mail</Label>
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {contrato.condominio.email}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parcelas ou Medições */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                {contrato.tipo_pagamento === 'medicoes' ? 'Medições' : 'Parcelas'}
                <Badge variant="outline" className="ml-2">
                  {contrato.tipo_pagamento === 'medicoes' 
                    ? `${contrato.total_medicoes} medição(ões)`
                    : `${contrato.parcelas_pagas}/${contrato.total_parcelas} pagas`
                  }
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contrato.tipo_pagamento === 'medicoes' ? (
                // Tabela de Medições
                contrato.medicoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma medição registrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Percentual</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contrato.medicoes.map((medicao) => (
                        <TableRow key={medicao.id}>
                          <TableCell>{formatDate(medicao.data_medicao)}</TableCell>
                          <TableCell>{medicao.percentual_executado}%</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(medicao.valor_medicao)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(medicao.status_pagamento)}>
                              {statusLabels[medicao.status_pagamento as keyof typeof statusLabels] || medicao.status_pagamento}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {medicao.status_pagamento !== 'pago' && (
                              <Button size="sm" variant="outline">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                // Tabela de Parcelas
                contrato.parcelas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma parcela registrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contrato.parcelas.map((parcela) => (
                        <TableRow key={parcela.id} className={parcela.status === 'vencida' ? 'bg-red-500/5' : ''}>
                          <TableCell className="font-medium">{parcela.numero_parcela}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(parcela.data_vencimento)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(parcela.valor_parcela)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(parcela.status)}>
                              {getStatusIcon(parcela.status)}
                              <span className="ml-1">
                                {parcela.status === 'pago' ? 'Pago' : parcela.status === 'vencida' ? 'Vencida' : 'Pendente'}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {parcela.data_pagamento ? (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(parcela.data_pagamento)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {parcela.status !== 'pago' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRegistrarPagamento(parcela)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Registrar Pagamento */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              Parcela {parcelaSelecionada?.numero_parcela} - Vencimento: {parcelaSelecionada && formatDate(parcelaSelecionada.data_vencimento)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor da Parcela</p>
              <p className="text-2xl font-bold">{parcelaSelecionada && formatCurrency(parcelaSelecionada.valor_parcela)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor Pago</Label>
              <Input
                id="valor_pago"
                type="number"
                step="0.01"
                value={pagamentoData.valor_pago}
                onChange={(e) => setPagamentoData({ ...pagamentoData, valor_pago: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data do Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={pagamentoData.data_pagamento}
                onChange={(e) => setPagamentoData({ ...pagamentoData, data_pagamento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o pagamento..."
                value={pagamentoData.observacoes}
                onChange={(e) => setPagamentoData({ ...pagamentoData, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPagamento(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarPagamento} disabled={loadingAcao}>
              {loadingAcao ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
