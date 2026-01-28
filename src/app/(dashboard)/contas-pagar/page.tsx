'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from 'sonner'
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
  FileText,
  Receipt,
  Package,
} from 'lucide-react'
import type { ContaPagar, StatusConta, Fornecedor, ItemContaPagar } from '@/types'

const categorias = [
  'Material de Construção',
  'Equipamentos',
  'Combustível',
  'Manutenção',
  'Serviços',
  'Alimentação',
  'Transporte',
  'Energia',
  'Água',
  'Telefone/Internet',
  'Aluguel',
  'Impostos',
  'Outros',
]

const metodosPagamento = [
  'Dinheiro',
  'PIX',
  'Transferência',
  'Boleto',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Cheque',
]

interface FormData {
  descricao: string
  valor: string
  data_vencimento: string
  categoria: string
  fornecedor_id: string
  observacoes: string
  metodo_pagamento: string
  conta_bancaria: string
  numero_nota: string
}

const initialFormData: FormData = {
  descricao: '',
  valor: '',
  data_vencimento: '',
  categoria: '',
  fornecedor_id: '',
  observacoes: '',
  metodo_pagamento: '',
  conta_bancaria: '',
  numero_nota: '',
}

export default function ContasPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusConta | 'todas'>('todas')
  
  // Modal states
  const [modalNovaContaOpen, setModalNovaContaOpen] = useState(false)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [modalImportarOpen, setModalImportarOpen] = useState(false)
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false)
  const [alertExcluirOpen, setAlertExcluirOpen] = useState(false)
  const [alertPagarOpen, setAlertPagarOpen] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [contaSelecionada, setContaSelecionada] = useState<ContaPagar | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)
  
  // Ref para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchContas()
    fetchFornecedores()
  }, [])

  async function fetchContas() {
    try {
      const response = await fetch('/api/contas-pagar')
      const result = await response.json()
      if (result.success && result.data) {
        setContas(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error)
      toast.error('Erro ao carregar contas a pagar')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFornecedores() {
    try {
      const response = await fetch('/api/fornecedores')
      const result = await response.json()
      if (result.success && result.data) {
        setFornecedores(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
    }
  }

  const handleNovaConta = () => {
    setFormData(initialFormData)
    setModalNovaContaOpen(true)
  }

  const handleEditarConta = (conta: ContaPagar) => {
    setContaSelecionada(conta)
    setFormData({
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      data_vencimento: conta.data_vencimento?.split('T')[0] || '',
      categoria: conta.categoria || '',
      fornecedor_id: conta.fornecedor_id || '',
      observacoes: conta.observacoes || '',
      metodo_pagamento: conta.metodo_pagamento || '',
      conta_bancaria: conta.conta_bancaria || '',
      numero_nota: conta.numero_nota || '',
    })
    setModalEditarOpen(true)
  }

  const handleVerDetalhes = async (conta: ContaPagar) => {
    // Buscar detalhes completos da conta (incluindo itens)
    try {
      const response = await fetch(`/api/contas-pagar/${conta.id}`)
      const result = await response.json()
      if (result.success && result.data) {
        setContaSelecionada(result.data)
      } else {
        // Fallback para dados da listagem
        setContaSelecionada(conta)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      setContaSelecionada(conta)
    }
    setModalDetalhesOpen(true)
  }

  const handleExcluirClick = (conta: ContaPagar) => {
    setContaSelecionada(conta)
    setAlertExcluirOpen(true)
  }

  const handlePagarClick = (conta: ContaPagar) => {
    setContaSelecionada(conta)
    setAlertPagarOpen(true)
  }

  const handleSalvarNovaConta = async () => {
    if (!formData.descricao || !formData.valor || !formData.data_vencimento) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSalvando(true)
    try {
      const response = await fetch('/api/contas-pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor.replace(',', '.')),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Conta criada com sucesso!')
        setModalNovaContaOpen(false)
        fetchContas()
      } else {
        toast.error(result.error || 'Erro ao criar conta')
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      toast.error('Erro ao criar conta')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarEdicao = async () => {
    if (!contaSelecionada || !formData.descricao || !formData.valor || !formData.data_vencimento) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSalvando(true)
    try {
      const response = await fetch(`/api/contas-pagar/${contaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor.replace(',', '.')),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Conta atualizada com sucesso!')
        setModalEditarOpen(false)
        fetchContas()
      } else {
        toast.error(result.error || 'Erro ao atualizar conta')
      }
    } catch (error) {
      console.error('Erro ao atualizar conta:', error)
      toast.error('Erro ao atualizar conta')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    if (!contaSelecionada) return

    setSalvando(true)
    try {
      const response = await fetch(`/api/contas-pagar/${contaSelecionada.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Conta excluída com sucesso!')
        setAlertExcluirOpen(false)
        fetchContas()
      } else {
        toast.error(result.error || 'Erro ao excluir conta')
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      toast.error('Erro ao excluir conta')
    } finally {
      setSalvando(false)
    }
  }

  const handleMarcarPago = async () => {
    if (!contaSelecionada) return

    setSalvando(true)
    try {
      const response = await fetch(`/api/contas-pagar/${contaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_pagamento: new Date().toISOString().split('T')[0],
          status: 'Pago',
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Conta marcada como paga!')
        setAlertPagarOpen(false)
        fetchContas()
      } else {
        toast.error(result.error || 'Erro ao marcar como pago')
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      toast.error('Erro ao marcar como pago')
    } finally {
      setSalvando(false)
    }
  }

  const handleImportarXML = () => {
    setModalImportarOpen(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast.error('Por favor, selecione um arquivo XML')
      return
    }

    setImportando(true)
    try {
      const formData = new FormData()
      formData.append('xml', file)

      const response = await fetch('/api/contas-pagar/importar-xml', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message || 'XML importado com sucesso!')
        setModalImportarOpen(false)
        fetchContas()
      } else {
        toast.error(result.error || 'Erro ao importar XML')
      }
    } catch (error) {
      console.error('Erro ao importar XML:', error)
      toast.error('Erro ao importar XML')
    } finally {
      setImportando(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
              <DropdownMenuItem onClick={() => handleVerDetalhes(conta)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {isPendente && (
                <DropdownMenuItem onClick={() => handlePagarClick(conta)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como pago
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditarConta(conta)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExcluirClick(conta)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Form component (reusable for create and edit)
  const FormularioConta = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            placeholder="Descrição da conta"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            placeholder="0,00"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
          <Input
            id="data_vencimento"
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Select
            value={formData.categoria}
            onValueChange={(value) => setFormData({ ...formData, categoria: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fornecedor">Fornecedor</Label>
          <Select
            value={formData.fornecedor_id}
            onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="metodo_pagamento">Método de Pagamento</Label>
          <Select
            value={formData.metodo_pagamento}
            onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {metodosPagamento.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero_nota">Número da Nota</Label>
          <Input
            id="numero_nota"
            placeholder="Ex: 12345"
            value={formData.numero_nota}
            onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conta_bancaria">Conta Bancária</Label>
          <Input
            id="conta_bancaria"
            placeholder="Ex: Banco do Brasil"
            value={formData.conta_bancaria}
            onChange={(e) => setFormData({ ...formData, conta_bancaria: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Observações adicionais..."
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  )

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
          <Button variant="outline" onClick={handleImportarXML}>
            <FileUp className="mr-2 h-4 w-4" />
            Importar XML
          </Button>
          <Button 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleNovaConta}
          >
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

      {/* Modal Nova Conta */}
      <Dialog open={modalNovaContaOpen} onOpenChange={setModalNovaContaOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Nova Conta a Pagar
            </DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta a pagar no sistema
            </DialogDescription>
          </DialogHeader>
          <FormularioConta />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovaContaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovaConta} disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Conta */}
      <Dialog open={modalEditarOpen} onOpenChange={setModalEditarOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Conta
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da conta
            </DialogDescription>
          </DialogHeader>
          <FormularioConta isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao} disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Importar XML */}
      <Dialog open={modalImportarOpen} onOpenChange={setModalImportarOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Importar XML de NF-e
            </DialogTitle>
            <DialogDescription>
              Selecione um arquivo XML de Nota Fiscal Eletrônica para importar automaticamente os dados da conta
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste o arquivo XML aqui ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                id="xml-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={importando}
              >
                {importando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ℹ️ O sistema irá extrair automaticamente: fornecedor, valor, data de emissão, número da nota e outros dados da NF-e.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalImportarOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={modalDetalhesOpen} onOpenChange={setModalDetalhesOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Conta
            </DialogTitle>
          </DialogHeader>
          {contaSelecionada && (
            <div className="space-y-6 py-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm border-b pb-2">Informações Básicas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Descrição</Label>
                    <p className="font-medium">{contaSelecionada.descricao}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Valor Total</Label>
                    <p className="font-semibold text-lg text-amber-600">{formatCurrency(contaSelecionada.valor)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Vencimento</Label>
                    <p>{formatDate(contaSelecionada.data_vencimento)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <Badge variant="secondary" className={statusColors[contaSelecionada.status]}>
                      {contaSelecionada.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {contaSelecionada.fornecedor && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Fornecedor</Label>
                      <p>{contaSelecionada.fornecedor.nome}</p>
                    </div>
                  )}
                  {contaSelecionada.categoria && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Categoria</Label>
                      <p>{contaSelecionada.categoria}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados da Nota Fiscal */}
              {(contaSelecionada.numero_nota || contaSelecionada.chave_nfe || contaSelecionada.valor_produtos) && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dados da Nota Fiscal
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {contaSelecionada.numero_nota && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Número</Label>
                        <p className="font-medium">{contaSelecionada.numero_nota}</p>
                      </div>
                    )}
                    {contaSelecionada.serie_nota && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Série</Label>
                        <p>{contaSelecionada.serie_nota}</p>
                      </div>
                    )}
                    {contaSelecionada.data_emissao_nota && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Data Emissão</Label>
                        <p>{formatDate(contaSelecionada.data_emissao_nota)}</p>
                      </div>
                    )}
                  </div>

                  {contaSelecionada.natureza_operacao && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Natureza da Operação</Label>
                      <p>{contaSelecionada.natureza_operacao}</p>
                    </div>
                  )}

                  {contaSelecionada.chave_nfe && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Chave NF-e</Label>
                      <p className="text-xs font-mono break-all bg-muted p-2 rounded">{contaSelecionada.chave_nfe}</p>
                    </div>
                  )}

                  {/* Valores Detalhados da Nota */}
                  {(Number(contaSelecionada.valor_produtos) > 0 || Number(contaSelecionada.valor_servicos) > 0 || 
                    Number(contaSelecionada.valor_frete) > 0 || Number(contaSelecionada.valor_desconto) > 0 || 
                    Number(contaSelecionada.valor_impostos) > 0) && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <Label className="text-muted-foreground text-xs font-semibold">Composição do Valor</Label>
                      <div className="space-y-1">
                        {Number(contaSelecionada.valor_produtos) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Produtos</span>
                            <span>{formatCurrency(Number(contaSelecionada.valor_produtos))}</span>
                          </div>
                        )}
                        {Number(contaSelecionada.valor_servicos) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Serviços</span>
                            <span>{formatCurrency(Number(contaSelecionada.valor_servicos))}</span>
                          </div>
                        )}
                        {Number(contaSelecionada.valor_frete) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Frete</span>
                            <span>{formatCurrency(Number(contaSelecionada.valor_frete))}</span>
                          </div>
                        )}
                        {Number(contaSelecionada.valor_impostos) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Impostos</span>
                            <span>{formatCurrency(Number(contaSelecionada.valor_impostos))}</span>
                          </div>
                        )}
                        {Number(contaSelecionada.valor_desconto) > 0 && (
                          <div className="flex justify-between text-sm text-red-500">
                            <span>Desconto</span>
                            <span>- {formatCurrency(Number(contaSelecionada.valor_desconto))}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                          <span>Total</span>
                          <span className="text-amber-600">{formatCurrency(contaSelecionada.valor)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Itens da Nota Fiscal */}
              {contaSelecionada.itens && contaSelecionada.itens.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens da Nota Fiscal ({contaSelecionada.itens.length} {contaSelecionada.itens.length === 1 ? 'item' : 'itens'})
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">#</th>
                          <th className="text-left p-2 font-medium">Descrição</th>
                          <th className="text-right p-2 font-medium">Qtd</th>
                          <th className="text-right p-2 font-medium">Unit.</th>
                          <th className="text-right p-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contaSelecionada.itens.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-muted/30 hover:bg-muted/20">
                            <td className="p-2 text-muted-foreground">{item.numero_item || index + 1}</td>
                            <td className="p-2">
                              <div>
                                <p className="font-medium text-xs">{item.descricao}</p>
                                {item.codigo_produto && (
                                  <p className="text-xs text-muted-foreground">Cód: {item.codigo_produto}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">
                              {item.quantidade} {item.unidade || 'UN'}
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">{formatCurrency(item.valor_unitario)}</td>
                            <td className="p-2 text-right whitespace-nowrap font-medium">{formatCurrency(item.valor_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-semibold">Total dos Itens:</td>
                          <td className="p-2 text-right font-semibold text-amber-600">
                            {formatCurrency(contaSelecionada.itens.reduce((sum, item) => sum + item.valor_total, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagamento */}
              {(contaSelecionada.metodo_pagamento || contaSelecionada.conta_bancaria || contaSelecionada.data_pagamento) && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Informações de Pagamento
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {contaSelecionada.metodo_pagamento && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Método de Pagamento</Label>
                        <p>{contaSelecionada.metodo_pagamento}</p>
                      </div>
                    )}
                    {contaSelecionada.conta_bancaria && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Conta Bancária</Label>
                        <p>{contaSelecionada.conta_bancaria}</p>
                      </div>
                    )}
                    {contaSelecionada.data_pagamento && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Data do Pagamento</Label>
                        <p className="text-emerald-600 font-medium">{formatDate(contaSelecionada.data_pagamento)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {(contaSelecionada.observacoes || contaSelecionada.observacoes_pagamento) && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm border-b pb-2">Observações</h4>
                  {contaSelecionada.observacoes && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Observações Gerais</Label>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{contaSelecionada.observacoes}</p>
                    </div>
                  )}
                  {contaSelecionada.observacoes_pagamento && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Observações do Pagamento</Label>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{contaSelecionada.observacoes_pagamento}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhesOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Excluir */}
      <AlertDialog open={alertExcluirOpen} onOpenChange={setAlertExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{contaSelecionada?.descricao}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-red-500 hover:bg-red-600"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Marcar como Pago */}
      <AlertDialog open={alertPagarOpen} onOpenChange={setAlertPagarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Pago</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma o pagamento da conta "{contaSelecionada?.descricao}" 
              no valor de {formatCurrency(contaSelecionada?.valor || 0)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarcarPago}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {salvando ? (
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
