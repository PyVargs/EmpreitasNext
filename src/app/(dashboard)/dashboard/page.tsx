'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/constants'
import {
  Briefcase,
  Users,
  Wrench,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Package,
  Building2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

interface DashboardStats {
  valor_total_empreitadas: number
  valor_total_retirado: number
  saldo_disponivel: number
  valor_empreitadas_ativas: number
  valor_retirado_ativas: number
  valor_empreitadas_todas: number
  valor_retirado_todas: number
  incluir_concluidas: boolean
  ferramentas_cd: number
  ferramentas_emprestadas: number
  ferramentas_manutencao: number
  total_funcionarios: number
  total_condominios: number
  total_contratos_ativos: number
  empreitadas_ativas: number
  empreitadas_concluidas: number
  contas_vencendo_hoje: number
  contas_atrasadas: number
  retiradas_por_mes: { name: string; valor: number }[]
  top_funcionarios: { id: number; nome: string; saldo: number }[]
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [incluirConcluidas, setIncluirConcluidas] = useState(false)

  const fetchStats = useCallback(async (incluirConcluidasParam: boolean) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard?incluir_concluidas=${incluirConcluidasParam}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        console.warn('Erro:', data.error)
        setError('Erro ao carregar dados')
      }
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err)
      setError('Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(incluirConcluidas)
  }, [incluirConcluidas, fetchStats])

  const handleToggleConcluidas = (checked: boolean) => {
    setIncluirConcluidas(checked)
  }

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendValue,
    variant = 'default',
  }: {
    title: string
    value: string | number
    description?: string
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
  }) => {
    const variants = {
      default: 'from-slate-500/10 to-slate-600/10 border-slate-500/20',
      success: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20',
      warning: 'from-amber-500/10 to-amber-600/10 border-amber-500/20',
      danger: 'from-red-500/10 to-red-600/10 border-red-500/20',
    }

    const iconVariants = {
      default: 'text-slate-500 bg-slate-500/10',
      success: 'text-emerald-500 bg-emerald-500/10',
      warning: 'text-amber-500 bg-amber-500/10',
      danger: 'text-red-500 bg-red-500/10',
    }

    return (
      <Card className={`bg-gradient-to-br ${variants[variant]} border backdrop-blur-sm`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              {(description || trend) && (
                <div className="flex items-center gap-2 mt-1">
                  {trend && (
                    <Badge
                      variant="secondary"
                      className={
                        trend === 'up'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }
                    >
                      {trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trendValue}
                    </Badge>
                  )}
                  {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const pieData = stats ? [
    { name: 'No CD', value: stats.ferramentas_cd, color: '#10b981' },
    { name: 'Emprestadas', value: stats.ferramentas_emprestadas, color: '#f59e0b' },
    { name: 'Manutenção', value: stats.ferramentas_manutencao, color: '#ef4444' },
  ] : []

  return (
    <>
      <Header title="Dashboard" description="Visão geral do sistema" />
      
      <div className="p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Toggle para Incluir Concluídas */}
        <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="toggle-concluidas" className="text-sm font-medium">
                Filtro de Empreitadas
              </Label>
              <p className="text-xs text-muted-foreground">
                {incluirConcluidas 
                  ? `Mostrando todas as empreitadas (${stats?.empreitadas_ativas || 0} ativas + ${stats?.empreitadas_concluidas || 0} concluídas)`
                  : `Mostrando apenas empreitadas ativas (${stats?.empreitadas_ativas || 0})`
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!incluirConcluidas ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                Somente Ativas
              </span>
              <Switch
                id="toggle-concluidas"
                checked={incluirConcluidas}
                onCheckedChange={handleToggleConcluidas}
              />
              <span className={`text-sm ${incluirConcluidas ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                Ativas + Concluídas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={incluirConcluidas ? "Valor Total (Todas)" : "Valor Total (Ativas)"}
            value={formatCurrency(stats?.valor_total_empreitadas || 0)}
            description={incluirConcluidas 
              ? `Ativas: ${formatCurrency(stats?.valor_empreitadas_ativas || 0)}`
              : `Total com concluídas: ${formatCurrency(stats?.valor_empreitadas_todas || 0)}`
            }
            icon={Briefcase}
            variant="success"
          />
          <StatCard
            title={incluirConcluidas ? "Total Retirado (Todas)" : "Total Retirado (Ativas)"}
            value={formatCurrency(stats?.valor_total_retirado || 0)}
            icon={DollarSign}
            description={incluirConcluidas 
              ? `Ativas: ${formatCurrency(stats?.valor_retirado_ativas || 0)}`
              : `Total com concluídas: ${formatCurrency(stats?.valor_retirado_todas || 0)}`
            }
            variant="warning"
          />
          <StatCard
            title={incluirConcluidas ? "Saldo (Todas)" : "Saldo (Ativas)"}
            value={formatCurrency(stats?.saldo_disponivel || 0)}
            icon={TrendingUp}
            description={incluirConcluidas 
              ? `Ativas: ${formatCurrency((stats?.valor_empreitadas_ativas || 0) - (stats?.valor_retirado_ativas || 0))}`
              : `Total com concluídas: ${formatCurrency((stats?.valor_empreitadas_todas || 0) - (stats?.valor_retirado_todas || 0))}`
            }
            variant="success"
          />
          <StatCard
            title="Contas Atrasadas"
            value={stats?.contas_atrasadas || 0}
            icon={AlertCircle}
            description={`${stats?.contas_vencendo_hoje || 0} vencendo hoje`}
            variant={(stats?.contas_atrasadas || 0) > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Funcionários"
            value={stats?.total_funcionarios || 0}
            icon={Users}
          />
          <StatCard
            title="Condomínios"
            value={stats?.total_condominios || 0}
            icon={Building2}
          />
          <StatCard
            title="Contratos Ativos"
            value={stats?.total_contratos_ativos || 0}
            icon={FileText}
          />
          <StatCard
            title="Empreitadas Ativas"
            value={stats?.empreitadas_ativas || 0}
            icon={Package}
            description={`${stats?.empreitadas_concluidas || 0} concluídas`}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Area Chart - Retiradas por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Retiradas por Mês</CardTitle>
              <CardDescription>
                Total de retiradas nos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats?.retiradas_por_mes || []}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Ferramentas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Ferramentas
              </CardTitle>
              <CardDescription>
                Distribuição por localização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e1e1e',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-muted-foreground">No CD</span>
                      <span className="font-semibold">{stats?.ferramentas_cd || 0}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-muted-foreground">Emprestadas</span>
                      <span className="font-semibold">{stats?.ferramentas_emprestadas || 0}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm text-muted-foreground">Manutenção</span>
                      <span className="font-semibold">{stats?.ferramentas_manutencao || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Top Funcionários */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Funcionários por Saldo</CardTitle>
            <CardDescription>
              {incluirConcluidas 
                ? 'Funcionários com maior saldo disponível em todas as empreitadas'
                : 'Funcionários com maior saldo disponível em empreitadas ativas'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.top_funcionarios && stats.top_funcionarios.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_funcionarios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    type="number"
                    stroke="#666"
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    stroke="#666"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                  />
                  <Bar
                    dataKey="saldo"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum funcionário com saldo disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
