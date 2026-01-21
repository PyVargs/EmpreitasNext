'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, formatPhone, formatCPF } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  FileText,
  Phone,
  MapPin,
  User,
  CreditCard,
  Briefcase,
  Wallet,
  TrendingUp,
  Calendar,
  Wrench,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  MoreHorizontal,
  Plus,
  CheckCircle,
  Lock,
  Trash2,
  Loader2,
  Download,
  Undo2,
  Package,
} from 'lucide-react'

interface FuncionarioDetalhes {
  id: number
  nome: string
  telefone?: string
  cpf?: string
  rg?: string
  endereco?: string
  ativo: boolean
  dataCadastro?: string
  total_empreitadas: number
  total_retirado: number
  saldo: number
  empreitadas: EmpreitadaItem[]
  retiradas: RetiradaItem[]
  ferramentas: FerramentaItem[]
}

interface EmpreitadaItem {
  id: number
  nome: string
  valorTotal: number
  concluida: boolean
  dataConclusao?: string
  data?: string
  condominio?: {
    id: number
    nome: string
  }
  retiradas: { valor: number }[]
}

interface RetiradaItem {
  id: number
  valor: number
  data: string
  descricao?: string
  empreitada?: {
    id: number
    nome: string
  }
}

interface FerramentaItem {
  id: number
  nome: string
  codigo?: string
  marca?: string
}

export default function FuncionarioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [funcionario, setFuncionario] = useState<FuncionarioDetalhes | null>(null)
  
  // Estados dos filtros de retiradas
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroEmpreitada, setFiltroEmpreitada] = useState<string>('todas')
  const [filtroDescricao, setFiltroDescricao] = useState('')
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)
  
  // Estado para mostrar empreitadas concluídas
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false)
  
  // Estado para linha expandida (mostra botões de ação)
  const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null)
  
  // Estados para modais de ação rápida
  const [modalNovaRetirada, setModalNovaRetirada] = useState(false)
  const [modalConcluir, setModalConcluir] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [empreitadaSelecionada, setEmpreitadaSelecionada] = useState<any>(null)
  const [loadingAcao, setLoadingAcao] = useState(false)
  
  // Campos do formulário de nova retirada
  const [novaRetiradaValor, setNovaRetiradaValor] = useState('')
  const [novaRetiradaDescricao, setNovaRetiradaDescricao] = useState('')
  const [novaRetiradaData, setNovaRetiradaData] = useState(new Date().toISOString().split('T')[0])
  
  // Campo de senha para editar empreitada
  const [senhaEditar, setSenhaEditar] = useState('')
  
  // Campos do formulário de editar empreitada
  const [editarNome, setEditarNome] = useState('')
  const [editarValor, setEditarValor] = useState('')
  const [senhaValidada, setSenhaValidada] = useState(false)
  
  // Estados para excluir retirada
  const [modalExcluirRetirada, setModalExcluirRetirada] = useState(false)
  const [retiradaSelecionada, setRetiradaSelecionada] = useState<any>(null)
  const [senhaExcluir, setSenhaExcluir] = useState('')
  const [senhaExcluirValidada, setSenhaExcluirValidada] = useState(false)
  
  // Estado para geração de PDF
  const [gerandoPDF, setGerandoPDF] = useState(false)
  
  // Estados para ferramentas
  const [modalDevolverFerramenta, setModalDevolverFerramenta] = useState(false)
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<any>(null)
  const [observacaoDevolucao, setObservacaoDevolucao] = useState('')
  const [devolvendo, setDevolvendo] = useState(false)
  
  // Estados para editar funcionário
  const [modalEditarFuncionario, setModalEditarFuncionario] = useState(false)
  const [editFuncNome, setEditFuncNome] = useState('')
  const [editFuncTelefone, setEditFuncTelefone] = useState('')
  const [editFuncCpf, setEditFuncCpf] = useState('')
  const [editFuncRg, setEditFuncRg] = useState('')
  const [editFuncEndereco, setEditFuncEndereco] = useState('')
  const [salvandoFuncionario, setSalvandoFuncionario] = useState(false)

  useEffect(() => {
    async function fetchFuncionario() {
      try {
        const response = await fetch(`/api/funcionarios/${params.id}`)
        const data = await response.json()
        
        if (data.success) {
          setFuncionario(data.data)
        } else {
          console.error('Erro:', data.error)
        }
      } catch (error) {
        console.error('Erro ao buscar funcionário:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchFuncionario()
    }
  }, [params.id])
  
  // Reset página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroDataInicio, filtroDataFim, filtroEmpreitada, filtroDescricao, itensPorPagina])
  
  // Dados derivados
  const empreitadas = funcionario?.empreitadas || []
  const retiradas = funcionario?.retiradas || []
  const ferramentas = funcionario?.ferramentas || []
  
  // Lista única de empreitadas para o filtro
  const empreitadasUnicas = useMemo(() => {
    const map = new Map<number, string>()
    retiradas.forEach((ret) => {
      if (ret.empreitada) {
        map.set(ret.empreitada.id, ret.empreitada.nome)
      }
    })
    return Array.from(map, ([id, nome]) => ({ id, nome }))
  }, [retiradas])
  
  // Filtrar retiradas
  const retiradasFiltradas = useMemo(() => {
    return retiradas.filter((ret) => {
      // Filtro por data início
      if (filtroDataInicio) {
        const dataRetirada = new Date(ret.data)
        const dataInicio = new Date(filtroDataInicio)
        if (dataRetirada < dataInicio) return false
      }
      
      // Filtro por data fim
      if (filtroDataFim) {
        const dataRetirada = new Date(ret.data)
        const dataFim = new Date(filtroDataFim)
        dataFim.setHours(23, 59, 59, 999) // Incluir todo o dia
        if (dataRetirada > dataFim) return false
      }
      
      // Filtro por empreitada
      if (filtroEmpreitada && filtroEmpreitada !== 'todas') {
        if (!ret.empreitada || ret.empreitada.id.toString() !== filtroEmpreitada) return false
      }
      
      // Filtro por descrição
      if (filtroDescricao) {
        const descricao = ret.descricao?.toLowerCase() || ''
        if (!descricao.includes(filtroDescricao.toLowerCase())) return false
      }
      
      return true
    })
  }, [retiradas, filtroDataInicio, filtroDataFim, filtroEmpreitada, filtroDescricao])
  
  // Paginação
  const totalPaginas = Math.ceil(retiradasFiltradas.length / itensPorPagina) || 1
  const retiradasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina
    return retiradasFiltradas.slice(inicio, inicio + itensPorPagina)
  }, [retiradasFiltradas, paginaAtual, itensPorPagina])
  
  // Total filtrado
  const totalValorFiltrado = useMemo(() => {
    return retiradasFiltradas.reduce((acc, ret) => acc + ret.valor, 0)
  }, [retiradasFiltradas])
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setFiltroEmpreitada('todas')
    setFiltroDescricao('')
  }
  
  // Função para recarregar dados do funcionário
  const recarregarDados = async () => {
    try {
      const response = await fetch(`/api/funcionarios/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setFuncionario(data.data)
      }
    } catch (error) {
      console.error('Erro ao recarregar dados:', error)
    }
  }
  
  // Abrir modal de nova retirada
  const abrirModalNovaRetirada = (emp: any) => {
    setEmpreitadaSelecionada(emp)
    setNovaRetiradaValor('')
    setNovaRetiradaDescricao('')
    setNovaRetiradaData(new Date().toISOString().split('T')[0])
    setModalNovaRetirada(true)
  }
  
  // Criar nova retirada
  const criarNovaRetirada = async () => {
    if (!empreitadaSelecionada || !novaRetiradaValor) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    
    setLoadingAcao(true)
    try {
      const response = await fetch('/api/retiradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId: parseInt(params.id as string),
          empreitadaId: empreitadaSelecionada.id,
          valor: parseFloat(novaRetiradaValor.replace(',', '.')),
          descricao: novaRetiradaDescricao || null,
          data: novaRetiradaData,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Retirada criada com sucesso!')
        setModalNovaRetirada(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao criar retirada')
      }
    } catch (error) {
      console.error('Erro ao criar retirada:', error)
      toast.error('Erro ao criar retirada')
    } finally {
      setLoadingAcao(false)
    }
  }
  
  // Abrir modal de concluir empreitada
  const abrirModalConcluir = (emp: any) => {
    setEmpreitadaSelecionada(emp)
    setModalConcluir(true)
  }
  
  // Concluir empreitada
  const concluirEmpreitada = async () => {
    if (!empreitadaSelecionada) return
    
    setLoadingAcao(true)
    try {
      const response = await fetch(`/api/empreitadas/${empreitadaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concluida: true,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Empreitada concluída com sucesso!')
        setModalConcluir(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao concluir empreitada')
      }
    } catch (error) {
      console.error('Erro ao concluir empreitada:', error)
      toast.error('Erro ao concluir empreitada')
    } finally {
      setLoadingAcao(false)
    }
  }
  
  // Abrir modal de editar empreitada
  const abrirModalEditar = (emp: any) => {
    setEmpreitadaSelecionada(emp)
    setSenhaEditar('')
    setSenhaValidada(false)
    setEditarNome(emp.nome)
    setEditarValor(emp.valorTotal.toString())
    setModalEditar(true)
  }
  
  // Validar senha
  const validarSenha = () => {
    // Senha fixa para edição (pode ser alterada para validação via API)
    if (senhaEditar === 'vbs151481') {
      setSenhaValidada(true)
      toast.success('Senha validada!')
    } else {
      toast.error('Senha incorreta')
    }
  }
  
  // Salvar edição da empreitada
  const salvarEdicaoEmpreitada = async () => {
    if (!empreitadaSelecionada || !editarNome || !editarValor) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    
    setLoadingAcao(true)
    try {
      const response = await fetch(`/api/empreitadas/${empreitadaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editarNome,
          valorTotal: parseFloat(editarValor.replace(',', '.')),
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Empreitada atualizada com sucesso!')
        setModalEditar(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao atualizar empreitada')
      }
    } catch (error) {
      console.error('Erro ao atualizar empreitada:', error)
      toast.error('Erro ao atualizar empreitada')
    } finally {
      setLoadingAcao(false)
    }
    setPaginaAtual(1)
  }
  
  // Abrir modal de excluir retirada
  const abrirModalExcluirRetirada = (ret: any) => {
    setRetiradaSelecionada(ret)
    setSenhaExcluir('')
    setSenhaExcluirValidada(false)
    setModalExcluirRetirada(true)
  }
  
  // Validar senha para excluir
  const validarSenhaExcluir = () => {
    if (senhaExcluir === 'vbs151481') {
      setSenhaExcluirValidada(true)
      toast.success('Senha validada!')
    } else {
      toast.error('Senha incorreta')
    }
  }
  
  // Excluir retirada
  const excluirRetirada = async () => {
    if (!retiradaSelecionada) return
    
    setLoadingAcao(true)
    try {
      const response = await fetch(`/api/retiradas/${retiradaSelecionada.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Retirada excluída com sucesso!')
        setModalExcluirRetirada(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao excluir retirada')
      }
    } catch (error) {
      console.error('Erro ao excluir retirada:', error)
      toast.error('Erro ao excluir retirada')
    } finally {
      setLoadingAcao(false)
    }
  }
  
  // Gerar PDF do funcionário
  const gerarPDF = async () => {
    if (!funcionario) return
    
    setGerandoPDF(true)
    try {
      // Importar dinamicamente para evitar problemas com SSR
      const { generateFuncionarioPDF } = await import('@/components/pdf/funcionario-pdf')
      
      const blob = await generateFuncionarioPDF({
        nome: funcionario.nome,
        telefone: funcionario.telefone,
        cpf: funcionario.cpf,
        rg: funcionario.rg,
        endereco: funcionario.endereco,
        ativo: funcionario.ativo,
        total_empreitadas: funcionario.total_empreitadas,
        total_retirado: funcionario.total_retirado,
        saldo: funcionario.saldo,
        empreitadas: funcionario.empreitadas,
        retiradas: funcionario.retiradas,
      })
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${funcionario.nome.replace(/\s+/g, '_')}_relatorio.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerandoPDF(false)
    }
  }
  
  // Abrir modal de devolver ferramenta
  const abrirModalDevolverFerramenta = (ferramenta: any) => {
    setFerramentaSelecionada(ferramenta)
    setObservacaoDevolucao('')
    setModalDevolverFerramenta(true)
  }
  
  // Abrir modal de editar funcionário
  const abrirModalEditarFuncionario = () => {
    if (!funcionario) return
    setEditFuncNome(funcionario.nome || '')
    setEditFuncTelefone(funcionario.telefone || '')
    setEditFuncCpf(funcionario.cpf || '')
    setEditFuncRg(funcionario.rg || '')
    setEditFuncEndereco(funcionario.endereco || '')
    setModalEditarFuncionario(true)
  }
  
  // Salvar edição do funcionário
  const salvarEdicaoFuncionario = async () => {
    if (!editFuncNome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    setSalvandoFuncionario(true)
    try {
      const response = await fetch(`/api/funcionarios/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editFuncNome,
          telefone: editFuncTelefone || null,
          cpf: editFuncCpf || null,
          rg: editFuncRg || null,
          endereco: editFuncEndereco || null,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Funcionário atualizado com sucesso!')
        setModalEditarFuncionario(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao atualizar funcionário')
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error)
      toast.error('Erro ao atualizar funcionário')
    } finally {
      setSalvandoFuncionario(false)
    }
  }
  
  // Devolver ferramenta ao CD
  const devolverFerramenta = async () => {
    if (!ferramentaSelecionada) return
    
    setDevolvendo(true)
    try {
      const response = await fetch(`/api/ferramentas/${ferramentaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'devolver',
          observacao: observacaoDevolucao,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Ferramenta devolvida com sucesso!')
        setModalDevolverFerramenta(false)
        await recarregarDados()
      } else {
        toast.error(data.error || 'Erro ao devolver ferramenta')
      }
    } catch (error) {
      console.error('Erro ao devolver ferramenta:', error)
      toast.error('Erro ao devolver ferramenta')
    } finally {
      setDevolvendo(false)
    }
  }
  
  const temFiltrosAtivos = filtroDataInicio || filtroDataFim || (filtroEmpreitada && filtroEmpreitada !== 'todas') || filtroDescricao

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[200px] lg:col-span-1" />
            <Skeleton className="h-[200px] lg:col-span-2" />
          </div>
        </div>
      </>
    )
  }

  if (!funcionario) {
    return (
      <>
        <Header />
        <div className="p-6">
          <p>Funcionário não encontrado</p>
          <Button variant="link" onClick={() => router.push('/funcionarios')}>
            Voltar para lista
          </Button>
        </div>
      </>
    )
  }

  const empreitadasAtivas = empreitadas.filter((e) => !e.concluida)
  const empreitadasConcluidas = empreitadas.filter((e) => e.concluida)
  
  // Calcular saldo restante para cada empreitada
  const empreitadasComSaldo = empreitadas.map((e) => {
    const valorRetirado = e.retiradas?.reduce((acc, r) => acc + r.valor, 0) || 0
    return {
      ...e,
      valor_retirado: valorRetirado,
      saldo_restante: e.valorTotal - valorRetirado,
    }
  })
  
  // Totais das empreitadas ativas
  const totaisAtivas = empreitadasComSaldo.filter(e => !e.concluida).reduce(
    (acc, emp) => ({
      valor: acc.valor + emp.valorTotal,
      retirado: acc.retirado + emp.valor_retirado,
      saldo: acc.saldo + emp.saldo_restante,
    }),
    { valor: 0, retirado: 0, saldo: 0 }
  )
  
  // Totais das empreitadas concluídas
  const totaisConcluidas = empreitadasComSaldo.filter(e => e.concluida).reduce(
    (acc, emp) => ({
      valor: acc.valor + emp.valorTotal,
      retirado: acc.retirado + emp.valor_retirado,
      saldo: acc.saldo + emp.saldo_restante,
    }),
    { valor: 0, retirado: 0, saldo: 0 }
  )

  return (
    <>
      <Header
        title={funcionario.nome}
        description="Detalhes do funcionário"
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Header with actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-bold">
              {funcionario.nome.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{funcionario.nome}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={
                    funcionario.ativo
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-slate-500/10 text-slate-500'
                  }
                >
                  {funcionario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                {funcionario.dataCadastro && (
                  <span className="text-sm text-muted-foreground">
                    Cadastrado em {formatDate(funcionario.dataCadastro)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Informações
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Funcionário
                  </DialogTitle>
                  <DialogDescription>
                    Dados pessoais e de contato
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {funcionario.telefone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-5 w-5 text-cyan-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium">{formatPhone(funcionario.telefone)}</p>
                      </div>
                    </div>
                  )}
                  {funcionario.cpf && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <CreditCard className="h-5 w-5 text-cyan-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">CPF</p>
                        <p className="font-medium">{formatCPF(funcionario.cpf)}</p>
                      </div>
                    </div>
                  )}
                  {funcionario.rg && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <CreditCard className="h-5 w-5 text-cyan-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">RG</p>
                        <p className="font-medium">{funcionario.rg}</p>
                      </div>
                    </div>
                  )}
                  {funcionario.endereco && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-cyan-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Endereço</p>
                        <p className="font-medium">{funcionario.endereco}</p>
                      </div>
                    </div>
                  )}
                  {!funcionario.telefone && !funcionario.cpf && !funcionario.rg && !funcionario.endereco && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhuma informação cadastrada
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={gerarPDF}
              disabled={gerandoPDF}
            >
              {gerandoPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Gerar PDF
                </>
              )}
            </Button>
            <Button onClick={abrirModalEditarFuncionario}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Total em Empreitadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(funcionario.total_empreitadas || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total Retirado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">
                {formatCurrency(funcionario.total_retirado || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Saldo Disponível
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(funcionario.saldo || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
            <Tabs defaultValue="empreitadas" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="empreitadas">
                    Empreitadas ({empreitadas.length})
                  </TabsTrigger>
                  <TabsTrigger value="retiradas">
                    Retiradas ({retiradas.length})
                  </TabsTrigger>
                  <TabsTrigger value="ferramentas">
                    Ferramentas ({ferramentas.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="empreitadas" className="space-y-4">
                  {empreitadas.length > 0 ? (
                    <>
                      {/* Ativas */}
                      {empreitadasAtivas.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-emerald-500 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            Ativas ({empreitadasAtivas.length})
                          </h4>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Condomínio</TableHead>
                                  <TableHead>Obra</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                  <TableHead className="text-right">Retirado</TableHead>
                                  <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {empreitadasComSaldo.filter(e => !e.concluida).map((emp) => (
                                  <>
                                    <TableRow 
                                      key={emp.id} 
                                      className={`hover:bg-muted/50 cursor-pointer transition-colors ${linhaExpandida === emp.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : ''}`}
                                      onClick={() => setLinhaExpandida(linhaExpandida === emp.id ? null : emp.id)}
                                    >
                                      <TableCell className="text-muted-foreground max-w-[150px] truncate">
                                        {emp.condominio?.nome || '-'}
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-cyan-500 font-medium">
                                          {emp.nome}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(emp.valorTotal)}
                                      </TableCell>
                                      <TableCell className="text-right text-amber-500">
                                        {formatCurrency(emp.valor_retirado)}
                                      </TableCell>
                                      <TableCell className={`text-right font-semibold ${emp.saldo_restante < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {formatCurrency(emp.saldo_restante)}
                                      </TableCell>
                                    </TableRow>
                                    {/* Linha de ações expandida */}
                                    {linhaExpandida === emp.id && (
                                      <TableRow key={`${emp.id}-actions`} className="bg-muted/30">
                                        <TableCell colSpan={5}>
                                          <div className="flex items-center gap-2 py-2">
                                            <Button 
                                              size="sm" 
                                              variant="default"
                                              className="bg-emerald-600 hover:bg-emerald-700"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                abrirModalNovaRetirada(emp)
                                              }}
                                            >
                                              <Plus className="h-4 w-4 mr-1" />
                                              Nova Retirada
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="default"
                                              className="bg-blue-600 hover:bg-blue-700"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                abrirModalConcluir(emp)
                                              }}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              Concluir
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                abrirModalEditar(emp)
                                              }}
                                            >
                                              <Lock className="h-4 w-4 mr-1" />
                                              Editar
                                            </Button>
                                            <div className="ml-auto">
                                              <Link href={`/empreitadas/${emp.id}`}>
                                                <Button size="sm" variant="ghost">
                                                  Ver detalhes →
                                                </Button>
                                              </Link>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                ))}
                                {/* Linha de Totais */}
                                <TableRow className="bg-muted/50 font-semibold border-t-2">
                                  <TableCell colSpan={2} className="text-right">
                                    Total Ativas:
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(totaisAtivas.valor)}
                                  </TableCell>
                                  <TableCell className="text-right text-amber-500">
                                    {formatCurrency(totaisAtivas.retirado)}
                                  </TableCell>
                                  <TableCell className={`text-right ${totaisAtivas.saldo < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {formatCurrency(totaisAtivas.saldo)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Concluídas */}
                      {empreitadasConcluidas.length > 0 && (
                        <div>
                          {empreitadasAtivas.length > 0 && <Separator className="my-4" />}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={() => setMostrarConcluidas(!mostrarConcluidas)}
                          >
                            <div className="h-2 w-2 rounded-full bg-slate-500 mr-2" />
                            {mostrarConcluidas ? 'Ocultar' : 'Mostrar'} Concluídas ({empreitadasConcluidas.length})
                            <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${mostrarConcluidas ? 'rotate-90' : ''}`} />
                          </Button>
                          
                          {mostrarConcluidas && (
                            <div className="overflow-x-auto mt-3">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Condomínio</TableHead>
                                    <TableHead>Obra</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Retirado</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {empreitadasComSaldo.filter(e => e.concluida).map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-muted/50 opacity-70">
                                      <TableCell className="text-muted-foreground max-w-[150px] truncate">
                                        {emp.condominio?.nome || '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Link 
                                          href={`/empreitadas/${emp.id}`}
                                          className="text-cyan-500 hover:underline font-medium"
                                        >
                                          {emp.nome}
                                        </Link>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(emp.valorTotal)}
                                      </TableCell>
                                      <TableCell className="text-right text-amber-500">
                                        {formatCurrency(emp.valor_retirado)}
                                      </TableCell>
                                      <TableCell className={`text-right font-semibold ${emp.saldo_restante < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {formatCurrency(emp.saldo_restante)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Linha de Totais */}
                                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                                    <TableCell colSpan={2} className="text-right">
                                      Total Concluídas:
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(totaisConcluidas.valor)}
                                    </TableCell>
                                    <TableCell className="text-right text-amber-500">
                                      {formatCurrency(totaisConcluidas.retirado)}
                                    </TableCell>
                                    <TableCell className={`text-right ${totaisConcluidas.saldo < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {formatCurrency(totaisConcluidas.saldo)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma empreitada registrada
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="retiradas" className="space-y-4">
                  {retiradas.length > 0 ? (
                    <>
                      {/* Filtros */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Filter className="h-4 w-4" />
                            Filtros
                          </div>
                          {temFiltrosAtivos && (
                            <Button variant="ghost" size="sm" onClick={limparFiltros}>
                              <X className="h-4 w-4 mr-1" />
                              Limpar filtros
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Filtro Data Início */}
                          <div className="space-y-2">
                            <Label htmlFor="dataInicio" className="text-xs">Data Início</Label>
                            <Input
                              id="dataInicio"
                              type="date"
                              value={filtroDataInicio}
                              onChange={(e) => setFiltroDataInicio(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Filtro Data Fim */}
                          <div className="space-y-2">
                            <Label htmlFor="dataFim" className="text-xs">Data Fim</Label>
                            <Input
                              id="dataFim"
                              type="date"
                              value={filtroDataFim}
                              onChange={(e) => setFiltroDataFim(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Filtro Empreitada */}
                          <div className="space-y-2">
                            <Label htmlFor="empreitada" className="text-xs">Empreitada</Label>
                            <Select value={filtroEmpreitada} onValueChange={setFiltroEmpreitada}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todas">Todas</SelectItem>
                                {empreitadasUnicas.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Filtro Descrição */}
                          <div className="space-y-2">
                            <Label htmlFor="descricao" className="text-xs">Descrição</Label>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="descricao"
                                type="text"
                                placeholder="Buscar..."
                                value={filtroDescricao}
                                onChange={(e) => setFiltroDescricao(e.target.value)}
                                className="h-9 pl-8"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resumo */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">
                          {retiradasFiltradas.length === retiradas.length ? (
                            <span>{retiradas.length} retirada(s)</span>
                          ) : (
                            <span>{retiradasFiltradas.length} de {retiradas.length} retirada(s)</span>
                          )}
                          {temFiltrosAtivos && (
                            <span className="ml-2 text-cyan-500">
                              • Total filtrado: {formatCurrency(totalValorFiltrado)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Por página:</Label>
                          <Select value={itensPorPagina.toString()} onValueChange={(v) => setItensPorPagina(Number(v))}>
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Tabela */}
                      {retiradasPaginadas.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Empreitada</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {retiradasPaginadas.map((ret) => (
                              <TableRow key={ret.id} className="group">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDate(ret.data)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {ret.empreitada ? (
                                    <Link 
                                      href={`/empreitadas/${ret.empreitada.id}`}
                                      className="text-cyan-500 hover:underline"
                                    >
                                      {ret.empreitada.nome}
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>{ret.descricao || '-'}</TableCell>
                                <TableCell className="text-right font-medium text-amber-500">
                                  {formatCurrency(ret.valor)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => abrirModalExcluirRetirada(ret)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma retirada encontrada com os filtros aplicados
                        </div>
                      )}
                      
                      {/* Paginação */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-muted-foreground">
                            Página {paginaAtual} de {totalPaginas}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaginaAtual(1)}
                              disabled={paginaAtual === 1}
                            >
                              Primeira
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                              disabled={paginaAtual === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                              disabled={paginaAtual === totalPaginas}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaginaAtual(totalPaginas)}
                              disabled={paginaAtual === totalPaginas}
                            >
                              Última
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma retirada registrada
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ferramentas">
                  {ferramentas.length > 0 ? (
                    <div className="space-y-3">
                      {ferramentas.map((ferramenta) => (
                        <div
                          key={ferramenta.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              <Wrench className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{ferramenta.nome}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {ferramenta.codigo && (
                                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                                    {ferramenta.codigo}
                                  </span>
                                )}
                                {ferramenta.marca && (
                                  <span>• {ferramenta.marca}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                              <Package className="h-3 w-3 mr-1" />
                              Emprestada
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                              onClick={() => abrirModalDevolverFerramenta(ferramenta)}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Devolver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">Nenhuma ferramenta emprestada</p>
                      <p className="text-sm">Este funcionário não possui ferramentas em seu poder no momento</p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
      </div>
      
      {/* Modal Nova Retirada */}
      <Dialog open={modalNovaRetirada} onOpenChange={setModalNovaRetirada}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Nova Retirada
            </DialogTitle>
            <DialogDescription>
              {empreitadaSelecionada && (
                <>Empreitada: <strong>{empreitadaSelecionada.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="text"
                placeholder="0,00"
                value={novaRetiradaValor}
                onChange={(e) => setNovaRetiradaValor(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={novaRetiradaData}
                onChange={(e) => setNovaRetiradaData(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição da retirada (opcional)"
                value={novaRetiradaDescricao}
                onChange={(e) => setNovaRetiradaDescricao(e.target.value)}
              />
            </div>
            
            {empreitadaSelecionada && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo atual:</span>
                  <span className={empreitadaSelecionada.saldo_restante < 0 ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                    {formatCurrency(empreitadaSelecionada.saldo_restante)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovaRetirada(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={criarNovaRetirada} 
              disabled={loadingAcao}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loadingAcao ? 'Salvando...' : 'Criar Retirada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Concluir Empreitada */}
      <AlertDialog open={modalConcluir} onOpenChange={setModalConcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Concluir Empreitada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar a empreitada <strong>{empreitadaSelecionada?.nome}</strong> como concluída?
              <br /><br />
              {empreitadaSelecionada && empreitadaSelecionada.saldo_restante < 0 && (
                <span className="text-red-500">
                  ⚠️ Atenção: Esta empreitada possui saldo negativo de {formatCurrency(empreitadaSelecionada.saldo_restante)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={concluirEmpreitada}
              disabled={loadingAcao}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loadingAcao ? 'Concluindo...' : 'Sim, Concluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal Editar Empreitada */}
      <Dialog open={modalEditar} onOpenChange={(open) => {
        setModalEditar(open)
        if (!open) {
          setSenhaValidada(false)
          setSenhaEditar('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Editar Empreitada
            </DialogTitle>
            <DialogDescription>
              {empreitadaSelecionada && (
                <>Empreitada: <strong>{empreitadaSelecionada.nome}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!senhaValidada ? (
            <div className="space-y-4 py-4">
              <div className="text-center text-muted-foreground mb-4">
                <Lock className="h-12 w-12 mx-auto mb-2 text-amber-500/50" />
                <p>Digite a senha de administrador para editar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite a senha"
                  value={senhaEditar}
                  onChange={(e) => setSenhaEditar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validarSenha()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalEditar(false)}>
                  Cancelar
                </Button>
                <Button onClick={validarSenha}>
                  Validar Senha
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editarNome">Nome da Empreitada</Label>
                <Input
                  id="editarNome"
                  type="text"
                  value={editarNome}
                  onChange={(e) => setEditarNome(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editarValor">Valor Total</Label>
                <Input
                  id="editarValor"
                  type="text"
                  value={editarValor}
                  onChange={(e) => setEditarValor(e.target.value)}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalEditar(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={salvarEdicaoEmpreitada} 
                  disabled={loadingAcao}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {loadingAcao ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal Excluir Retirada */}
      <Dialog open={modalExcluirRetirada} onOpenChange={(open) => {
        setModalExcluirRetirada(open)
        if (!open) {
          setSenhaExcluirValidada(false)
          setSenhaExcluir('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Excluir Retirada
            </DialogTitle>
            <DialogDescription>
              {retiradaSelecionada && (
                <>
                  Valor: <strong className="text-amber-500">{formatCurrency(retiradaSelecionada.valor)}</strong>
                  {retiradaSelecionada.empreitada && (
                    <> • Empreitada: <strong>{retiradaSelecionada.empreitada.nome}</strong></>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!senhaExcluirValidada ? (
            <div className="space-y-4 py-4">
              <div className="text-center text-muted-foreground mb-4">
                <Lock className="h-12 w-12 mx-auto mb-2 text-red-500/50" />
                <p>Digite a senha de administrador para excluir</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senhaExcluir">Senha</Label>
                <Input
                  id="senhaExcluir"
                  type="password"
                  placeholder="Digite a senha"
                  value={senhaExcluir}
                  onChange={(e) => setSenhaExcluir(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validarSenhaExcluir()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalExcluirRetirada(false)}>
                  Cancelar
                </Button>
                <Button onClick={validarSenhaExcluir} className="bg-red-600 hover:bg-red-700">
                  Validar Senha
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <Trash2 className="h-10 w-10 mx-auto mb-2 text-red-500" />
                <p className="text-red-500 font-semibold">Tem certeza que deseja excluir esta retirada?</p>
                <p className="text-sm text-muted-foreground mt-2">Esta ação não pode ser desfeita.</p>
              </div>
              
              {retiradaSelecionada && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-amber-500">{formatCurrency(retiradaSelecionada.valor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span>{formatDate(retiradaSelecionada.data)}</span>
                  </div>
                  {retiradaSelecionada.descricao && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descrição:</span>
                      <span>{retiradaSelecionada.descricao}</span>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalExcluirRetirada(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={excluirRetirada} 
                  disabled={loadingAcao}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loadingAcao ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal Devolver Ferramenta */}
      <Dialog open={modalDevolverFerramenta} onOpenChange={setModalDevolverFerramenta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-cyan-500" />
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
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="observacaoDevolucao">Observação (opcional)</Label>
              <Textarea
                id="observacaoDevolucao"
                placeholder="Ex: Ferramenta em bom estado"
                value={observacaoDevolucao}
                onChange={(e) => setObservacaoDevolucao(e.target.value)}
              />
            </div>
            
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-sm">
              <p className="text-cyan-500 font-medium">A ferramenta será devolvida ao CD (Centro de Distribuição)</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDevolverFerramenta(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={devolverFerramenta} 
              disabled={devolvendo}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {devolvendo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Devolvendo...
                </>
              ) : (
                <>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Confirmar Devolução
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Editar Funcionário */}
      <Dialog open={modalEditarFuncionario} onOpenChange={setModalEditarFuncionario}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-cyan-500" />
              Editar Funcionário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do funcionário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="editFuncNome">Nome *</Label>
              <Input
                id="editFuncNome"
                type="text"
                placeholder="Nome completo"
                value={editFuncNome}
                onChange={(e) => setEditFuncNome(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFuncTelefone">Telefone</Label>
                <Input
                  id="editFuncTelefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={editFuncTelefone}
                  onChange={(e) => setEditFuncTelefone(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editFuncCpf">CPF</Label>
                <Input
                  id="editFuncCpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={editFuncCpf}
                  onChange={(e) => setEditFuncCpf(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFuncRg">RG</Label>
              <Input
                id="editFuncRg"
                type="text"
                placeholder="RG"
                value={editFuncRg}
                onChange={(e) => setEditFuncRg(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFuncEndereco">Endereço</Label>
              <Textarea
                id="editFuncEndereco"
                placeholder="Endereço completo"
                value={editFuncEndereco}
                onChange={(e) => setEditFuncEndereco(e.target.value)}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>ℹ️ O status "Ativo/Inativo" é calculado automaticamente baseado nas empreitadas do funcionário.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditarFuncionario(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarEdicaoFuncionario} 
              disabled={salvandoFuncionario}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {salvandoFuncionario ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
