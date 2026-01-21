import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Wrench,
  Package,
  Receipt,
  Building2,
  Landmark,
  ShoppingCart,
  Settings,
  Banknote,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: NavItem[]
}

export const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Funcionários',
    href: '/funcionarios',
    icon: Users,
  },
  {
    title: 'Condomínios',
    href: '/condominios',
    icon: Landmark,
  },
  {
    title: 'Empreitadas',
    href: '/empreitadas',
    icon: Briefcase,
  },
  {
    title: 'Retiradas',
    href: '/retiradas',
    icon: Banknote,
  },
  {
    title: 'Contratos',
    href: '/contratos',
    icon: FileText,
  },
  {
    title: 'Ferramentas',
    href: '/ferramentas',
    icon: Wrench,
  },
  {
    title: 'Pedidos',
    href: '/pedidos',
    icon: ShoppingCart,
  },
  {
    title: 'Contas a Pagar',
    href: '/contas-pagar',
    icon: Receipt,
  },
  {
    title: 'Fornecedores',
    href: '/fornecedores',
    icon: Building2,
  },
  {
    title: 'Produtos',
    href: '/produtos',
    icon: Package,
  },
]

export const adminNavigation: NavItem[] = [
  {
    title: 'Configurações',
    href: '/admin',
    icon: Settings,
  },
]

// Status colors
export const statusColors = {
  // Empreitada
  ativa: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  concluida: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  
  // Parcela
  pendente: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  paga: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  vencida: 'bg-red-500/10 text-red-500 border-red-500/20',
  em_atraso: 'bg-red-500/10 text-red-500 border-red-500/20',
  cancelada: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  
  // Contrato
  ativo: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  pausado: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  finalizado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  // cancelado already defined
  
  // Pedido
  aprovado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_transito: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  entregue: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  
  // Ferramenta
  CD: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  FUNCIONARIO: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  MANUTENCAO: 'bg-red-500/10 text-red-500 border-red-500/20',
  
  // Conta
  Pendente: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Pago: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Atrasado: 'bg-red-500/10 text-red-500 border-red-500/20',
} as const

export const statusLabels = {
  // Localização Ferramenta
  CD: 'No CD',
  FUNCIONARIO: 'Emprestada',
  MANUTENCAO: 'Manutenção',
  
  // Status Contrato
  ativo: 'Ativo',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  
  // Status Parcela
  pendente: 'Pendente',
  paga: 'Paga',
  vencida: 'Vencida',
  em_atraso: 'Em Atraso',
  cancelada: 'Cancelada',
  
  // Status Pedido
  aprovado: 'Aprovado',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  
  // Tipo Pagamento
  parcelas: 'Parcelas',
  medicoes: 'Medições',
} as const

// Formatters
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}
