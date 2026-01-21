'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
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
import { ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Wrench,
  User,
  Building2,
  Package,
  QrCode,
  FileText,
  Loader2,
  RotateCcw,
  Settings,
  AlertTriangle,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { FerramentasDownloadButton } from '@/components/pdf/ferramentas-download-button'

interface Ferramenta {
  id: string
  codigo: string
  nome: string
  marca?: string
  descricao?: string
  localizacao_atual?: string
  funcionario_atual?: string
  funcionario_atual_id?: string
  obra_atual?: string
  condominio_id?: string
  tipo?: string
  categoria?: string
  funcionario?: { id: string; nome: string }
  condominio?: { id: string; nome: string }
}

interface Funcionario {
  id: string
  nome: string
}

interface Condominio {
  id: string
  nome: string
}

type LocalizacaoFilter = 'todas' | 'CD' | 'FUNCIONARIO' | 'MANUTENCAO'

const localizacaoLabels: Record<string, string> = {
  CD: 'No CD',
  FUNCIONARIO: 'Emprestada',
  MANUTENCAO: 'Manutenção',
}

const localizacaoColors: Record<string, string> = {
  CD: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  FUNCIONARIO: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  MANUTENCAO: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function FerramentasPage() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterLocalizacao, setFilterLocalizacao] = useState<LocalizacaoFilter>('todas')
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    tipo: '',
    categoria: '',
    descricao: '',
  })

  // Estados para filtros avançados
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroCondominio, setFiltroCondominio] = useState<string>('todos')

  // Estados para modais de ação
  const [modalEmprestar, setModalEmprestar] = useState(false)
  const [modalDevolver, setModalDevolver] = useState(false)
  const [modalManutencao, setModalManutencao] = useState(false)
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<Ferramenta | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState('')
  const [observacao, setObservacao] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    fetchFerramentas()
    fetchFuncionarios()
    fetchCondominios()
  }, [])

  async function fetchFerramentas() {
    try {
      const response = await fetch('/api/ferramentas')
      const data = await response.json()

      if (data.success) {
        setFerramentas(data.data)
      } else {
        toast.error('Erro ao carregar ferramentas')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFuncionarios() {
    try {
      const response = await fetch('/api/funcionarios')
      const data = await response.json()

      if (data.success) {
        setFuncionarios(data.data.map((f: any) => ({ id: f.id, nome: f.nome })))
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  async function fetchCondominios() {
    try {
      const response = await fetch('/api/condominios')
      const data = await response.json()

      if (data.success) {
        setCondominios(data.data.map((c: any) => ({ id: c.id, nome: c.nome })))
      }
    } catch (error) {
      console.error('Erro ao carregar condomínios:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Por enquanto, apenas simular
      toast.success('Ferramenta cadastrada com sucesso!')
      setDialogOpen(false)
      setFormData({ nome: '', marca: '', tipo: '', categoria: '', descricao: '' })
      fetchFerramentas()
    } catch {
      toast.error('Erro ao cadastrar ferramenta')
    } finally {
      setSaving(false)
    }
  }

  // Abrir modal de emprestar
  const abrirModalEmprestar = (ferramenta: Ferramenta) => {
    setFerramentaSelecionada(ferramenta)
    setFuncionarioSelecionado('')
    setObservacao('')
    setModalEmprestar(true)
  }

  // Abrir modal de devolver
  const abrirModalDevolver = (ferramenta: Ferramenta) => {
    setFerramentaSelecionada(ferramenta)
    setObservacao('')
    setModalDevolver(true)
  }

  // Abrir modal de manutenção
  const abrirModalManutencao = (ferramenta: Ferramenta, tipo: 'enviar' | 'retornar') => {
    setFerramentaSelecionada(ferramenta)
    setObservacao('')
    setModalManutencao(true)
  }

  // Emprestar ferramenta
  const emprestar = async () => {
    if (!ferramentaSelecionada || !funcionarioSelecionado) return

    setProcessando(true)
    try {
      const response = await fetch(`/api/ferramentas/${ferramentaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'emprestar',
          funcionarioId: funcionarioSelecionado,
          observacao,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ferramenta emprestada com sucesso!')
        setModalEmprestar(false)
        fetchFerramentas()
      } else {
        toast.error(data.error || 'Erro ao emprestar ferramenta')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao emprestar ferramenta')
    } finally {
      setProcessando(false)
    }
  }

  // Devolver ferramenta ao CD
  const devolver = async () => {
    if (!ferramentaSelecionada) return

    setProcessando(true)
    try {
      const response = await fetch(`/api/ferramentas/${ferramentaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'devolver',
          observacao,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ferramenta devolvida ao CD com sucesso!')
        setModalDevolver(false)
        fetchFerramentas()
      } else {
        toast.error(data.error || 'Erro ao devolver ferramenta')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao devolver ferramenta')
    } finally {
      setProcessando(false)
    }
  }

  // Enviar para manutenção ou retornar ao CD
  const alterarStatusManutencao = async (novoStatus: 'MANUTENCAO' | 'CD') => {
    if (!ferramentaSelecionada) return

    setProcessando(true)
    try {
      const response = await fetch(`/api/ferramentas/${ferramentaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localizacaoAtual: novoStatus,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const mensagem = novoStatus === 'MANUTENCAO' 
          ? 'Ferramenta enviada para manutenção!'
          : 'Ferramenta retornou ao CD!'
        toast.success(mensagem)
        setModalManutencao(false)
        fetchFerramentas()
      } else {
        toast.error(data.error || 'Erro ao alterar status')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status')
    } finally {
      setProcessando(false)
    }
  }

  // Extrair categorias únicas das ferramentas
  const categoriasUnicas = Array.from(
    new Set(ferramentas.map((f) => f.categoria || f.tipo).filter(Boolean))
  ).sort()

  // Extrair funcionários que têm ferramentas emprestadas
  const funcionariosComFerramentas = Array.from(
    new Set(
      ferramentas
        .filter((f) => f.funcionario_atual_id)
        .map((f) => JSON.stringify({ id: f.funcionario_atual_id, nome: f.funcionario?.nome || f.funcionario_atual }))
    )
  ).map((s) => JSON.parse(s)).filter((f) => f.nome)

  // Extrair condomínios que têm ferramentas
  const condominiosComFerramentas = Array.from(
    new Set(
      ferramentas
        .filter((f) => f.condominio)
        .map((f) => JSON.stringify({ id: f.condominio?.id, nome: f.condominio?.nome }))
    )
  ).map((s) => JSON.parse(s)).filter((c) => c.nome)

  // Filtragem avançada
  const filteredFerramentas = ferramentas.filter((f) => {
    // Filtro por localização
    if (filterLocalizacao !== 'todas' && f.localizacao_atual !== filterLocalizacao) {
      return false
    }
    
    // Filtro por funcionário
    if (filtroFuncionario !== 'todos' && f.funcionario_atual_id !== filtroFuncionario) {
      return false
    }
    
    // Filtro por categoria
    if (filtroCategoria !== 'todas') {
      const categoria = f.categoria || f.tipo
      if (categoria !== filtroCategoria) {
        return false
      }
    }
    
    // Filtro por condomínio
    if (filtroCondominio !== 'todos' && f.condominio?.id !== filtroCondominio) {
      return false
    }
    
    return true
  })

  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroFuncionario !== 'todos' || filtroCategoria !== 'todas' || filtroCondominio !== 'todos'

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroFuncionario('todos')
    setFiltroCategoria('todas')
    setFiltroCondominio('todos')
    setFilterLocalizacao('todas')
  }

  // Stats
  const stats = {
    cd: ferramentas.filter((f) => f.localizacao_atual === 'CD').length,
    emprestadas: ferramentas.filter((f) => f.localizacao_atual === 'FUNCIONARIO').length,
    manutencao: ferramentas.filter((f) => f.localizacao_atual === 'MANUTENCAO').length,
    total: ferramentas.length,
  }

  const columns: ColumnDef<Ferramenta>[] = [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono font-bold">
          {row.original.codigo}
        </Badge>
      ),
    },
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Ferramenta
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nome}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.marca && `${row.original.marca} • `}
            {row.original.tipo || row.original.categoria || 'Sem categoria'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'localizacao_atual',
      header: 'Localização',
      cell: ({ row }) => {
        const loc = row.original.localizacao_atual || 'CD'
        return (
          <Badge variant="secondary" className={localizacaoColors[loc] || localizacaoColors.CD}>
            {localizacaoLabels[loc] || loc}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'funcionario_atual',
      header: 'Com Funcionário',
      cell: ({ row }) => {
        if (row.original.localizacao_atual !== 'FUNCIONARIO') return '-'

        return (
          <div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{row.original.funcionario?.nome || row.original.funcionario_atual || 'N/A'}</span>
            </div>
            {row.original.condominio && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{row.original.condominio.nome}</span>
              </div>
            )}
            {row.original.obra_atual && !row.original.condominio && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{row.original.obra_atual}</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const ferramenta = row.original
        const isEmprestada = ferramenta.localizacao_atual === 'FUNCIONARIO'
        const isManutencao = ferramenta.localizacao_atual === 'MANUTENCAO'
        const isNoCD = ferramenta.localizacao_atual === 'CD'

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
                <Link href={`/ferramentas/${ferramenta.codigo}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isNoCD && (
                <DropdownMenuItem onClick={() => abrirModalEmprestar(ferramenta)}>
                  <User className="mr-2 h-4 w-4" />
                  Emprestar
                </DropdownMenuItem>
              )}
              {isEmprestada && (
                <DropdownMenuItem onClick={() => abrirModalDevolver(ferramenta)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Devolver ao CD
                </DropdownMenuItem>
              )}
              {!isManutencao && (
                <DropdownMenuItem onClick={() => abrirModalManutencao(ferramenta, 'enviar')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Enviar p/ manutenção
                </DropdownMenuItem>
              )}
              {isManutencao && (
                <DropdownMenuItem onClick={() => abrirModalManutencao(ferramenta, 'retornar')}>
                  <Package className="mr-2 h-4 w-4" />
                  Retornar ao CD
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
      <Header title="Ferramentas" description="Gerencie o inventário de ferramentas" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card
            className={`cursor-pointer transition-all ${filterLocalizacao === 'CD' ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => setFilterLocalizacao(filterLocalizacao === 'CD' ? 'todas' : 'CD')}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-500" />
                No CD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">{stats.cd}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${filterLocalizacao === 'FUNCIONARIO' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => setFilterLocalizacao(filterLocalizacao === 'FUNCIONARIO' ? 'todas' : 'FUNCIONARIO')}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-500" />
                Emprestadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{stats.emprestadas}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${filterLocalizacao === 'MANUTENCAO' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilterLocalizacao(filterLocalizacao === 'MANUTENCAO' ? 'todas' : 'MANUTENCAO')}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-red-500" />
                Manutenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{stats.manutencao}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        <PageHeader
          title="Ferramentas"
          description={`${ferramentas.length} ferramenta(s) cadastrada(s)`}
        >
          <FerramentasDownloadButton />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ferramenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nova Ferramenta</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da ferramenta.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Furadeira Bosch GSB 550"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca</Label>
                      <Input
                        id="marca"
                        placeholder="Ex: Bosch"
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Input
                        id="tipo"
                        placeholder="Ex: Furadeira"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elétrica">Elétrica</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Medição">Medição</SelectItem>
                        <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                        <SelectItem value="Segurança">Segurança</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Detalhes adicionais..."
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
                      'Cadastrar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Filtros Avançados */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avançados
              </CardDescription>
              {temFiltrosAtivos && (
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Filtro por Funcionário */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Funcionário</Label>
                <Select value={filtroFuncionario} onValueChange={setFiltroFuncionario}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos os funcionários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os funcionários</SelectItem>
                    {funcionariosComFerramentas.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Categoria */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Categoria/Tipo</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {categoriasUnicas.map((cat) => (
                      <SelectItem key={cat} value={cat as string}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Condomínio/Prédio */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Prédio/Condomínio</Label>
                <Select value={filtroCondominio} onValueChange={setFiltroCondominio}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos os prédios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os prédios</SelectItem>
                    {condominiosComFerramentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {temFiltrosAtivos && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{filteredFerramentas.length}</span> de{' '}
                  <span className="font-semibold text-foreground">{ferramentas.length}</span> ferramenta(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFerramentas}
            searchKey="nome"
            searchPlaceholder="Buscar ferramenta..."
          />
        )}
      </div>

      {/* Modal Emprestar */}
      <Dialog open={modalEmprestar} onOpenChange={setModalEmprestar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Emprestar Ferramenta
            </DialogTitle>
            <DialogDescription>
              {ferramentaSelecionada && (
                <>Ferramenta: <strong>{ferramentaSelecionada.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {ferramentaSelecionada && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{ferramentaSelecionada.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {ferramentaSelecionada.codigo && `Código: ${ferramentaSelecionada.codigo}`}
                      {ferramentaSelecionada.marca && ` • ${ferramentaSelecionada.marca}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="funcionario">Funcionário *</Label>
              <Select
                value={funcionarioSelecionado}
                onValueChange={setFuncionarioSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                placeholder="Ex: Emprestada para obra do condomínio X"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEmprestar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={emprestar}
              disabled={processando || !funcionarioSelecionado}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Emprestando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Confirmar Empréstimo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Devolver */}
      <Dialog open={modalDevolver} onOpenChange={setModalDevolver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-cyan-500" />
              Devolver Ferramenta ao CD
            </DialogTitle>
            <DialogDescription>
              {ferramentaSelecionada && (
                <>Ferramenta: <strong>{ferramentaSelecionada.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {ferramentaSelecionada && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{ferramentaSelecionada.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {ferramentaSelecionada.codigo && `Código: ${ferramentaSelecionada.codigo}`}
                      {ferramentaSelecionada.marca && ` • ${ferramentaSelecionada.marca}`}
                    </p>
                    {ferramentaSelecionada.funcionario_atual && (
                      <p className="text-sm text-amber-500">
                        Com: {ferramentaSelecionada.funcionario?.nome || ferramentaSelecionada.funcionario_atual}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacaoDevolver">Observação (opcional)</Label>
              <Textarea
                id="observacaoDevolver"
                placeholder="Ex: Ferramenta em bom estado"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-sm">
              <p className="text-cyan-500 font-medium">A ferramenta será devolvida ao CD (Centro de Distribuição)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDevolver(false)}>
              Cancelar
            </Button>
            <Button
              onClick={devolver}
              disabled={processando}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Devolvendo...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Devolução
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Manutenção */}
      <Dialog open={modalManutencao} onOpenChange={setModalManutencao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {ferramentaSelecionada?.localizacao_atual === 'MANUTENCAO' ? (
                <>
                  <Package className="h-5 w-5 text-emerald-500" />
                  Retornar Ferramenta ao CD
                </>
              ) : (
                <>
                  <Settings className="h-5 w-5 text-red-500" />
                  Enviar para Manutenção
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {ferramentaSelecionada && (
                <>Ferramenta: <strong>{ferramentaSelecionada.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {ferramentaSelecionada && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    ferramentaSelecionada.localizacao_atual === 'MANUTENCAO' 
                      ? 'bg-red-500/20' 
                      : 'bg-amber-500/20'
                  }`}>
                    <Wrench className={`h-5 w-5 ${
                      ferramentaSelecionada.localizacao_atual === 'MANUTENCAO'
                        ? 'text-red-500'
                        : 'text-amber-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">{ferramentaSelecionada.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {ferramentaSelecionada.codigo && `Código: ${ferramentaSelecionada.codigo}`}
                      {ferramentaSelecionada.marca && ` • ${ferramentaSelecionada.marca}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {ferramentaSelecionada?.localizacao_atual === 'MANUTENCAO' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm">
                <p className="text-emerald-500 font-medium">
                  A ferramenta será marcada como disponível no CD
                </p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-red-500">
                  A ferramenta será marcada como em manutenção e ficará indisponível para empréstimo
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalManutencao(false)}>
              Cancelar
            </Button>
            {ferramentaSelecionada?.localizacao_atual === 'MANUTENCAO' ? (
              <Button
                onClick={() => alterarStatusManutencao('CD')}
                disabled={processando}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Retornar ao CD
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => alterarStatusManutencao('MANUTENCAO')}
                disabled={processando}
                className="bg-red-600 hover:bg-red-700"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Enviar p/ Manutenção
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
