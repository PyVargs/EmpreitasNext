'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { VBS_LOGO_BASE64 } from './logo-base64'

// Registrar fonte
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#f59e0b',
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    width: '23%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statSubtext: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  financialCard: {
    flex: 1,
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
  },
  financialCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  financialCardAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  financialCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  financialLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 5,
  },
  financialValueGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  financialValueAmber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
  },
  financialValueBlue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgeAmber: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  badgeSlate: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  summaryBox: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  miniTable: {
    marginTop: 5,
  },
  miniTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  miniTableLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  miniTableValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

interface RelatorioData {
  geradoEm: string
  estatisticas: {
    usuarios: { total: number; ativos: number }
    funcionarios: { total: number; ativos: number }
    condominios: { total: number; ativos: number }
    empreitadas: { total: number; ativas: number; concluidas: number; valor_total: number }
    ferramentas: { total: number; por_localizacao: { localizacao: string; quantidade: number }[] }
    retiradas: { total: number; valor_total: number }
  }
  financeiro: {
    valor_empreitadas: number
    valor_retirado: number
    saldo: number
  }
  empreitadasAtivas: {
    nome: string
    condominio: string
    funcionario: string
    valor_total: number
    valor_retirado: number
    saldo: number
  }[]
  ferramentasEmprestadas: {
    nome: string
    codigo: string
    funcionario: string
    obra?: string
  }[]
  ultimasAtividades: {
    empreitada: string
    acao: string
    usuario: string
    data: string
  }[]
  condominiosResumo: {
    nome: string
    empreitadas_ativas: number
    valor_total: number
    saldo: number
  }[]
}

interface RelatorioSistemaPDFProps {
  data: RelatorioData
}

export function RelatorioSistemaPDF({ data }: RelatorioSistemaPDFProps) {
  const { estatisticas, financeiro, empreitadasAtivas, ferramentasEmprestadas, ultimasAtividades, condominiosResumo } = data

  return (
    <Document>
      {/* Página 1 - Resumo Executivo */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src={VBS_LOGO_BASE64} style={styles.logo} />
            <Text style={styles.companyName}>Via Brasil Sul</Text>
          </View>
          <Text style={styles.title}>Relatório Gerencial</Text>
          <Text style={styles.subtitle}>Sistema de Gestão de Obras</Text>
          <Text style={styles.dateText}>Gerado em: {formatDateTime(data.geradoEm)}</Text>
        </View>

        {/* Resumo Executivo */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>📊 Resumo Executivo</Text>
          <Text style={styles.summaryText}>
            O sistema possui {estatisticas.funcionarios.total} funcionário(s) cadastrado(s), 
            gerenciando {estatisticas.empreitadas.ativas} empreitada(s) ativa(s) em {estatisticas.condominios.ativos} condomínio(s). 
            O valor total em empreitadas é de {formatCurrency(financeiro.valor_empreitadas)}, 
            com {formatCurrency(financeiro.valor_retirado)} já retirado, 
            resultando em um saldo de {formatCurrency(financeiro.saldo)}.
          </Text>
        </View>

        {/* Estatísticas Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Funcionários</Text>
              <Text style={styles.statValue}>{estatisticas.funcionarios.total}</Text>
              <Text style={styles.statSubtext}>{estatisticas.funcionarios.ativos} ativos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Condomínios</Text>
              <Text style={styles.statValue}>{estatisticas.condominios.total}</Text>
              <Text style={styles.statSubtext}>{estatisticas.condominios.ativos} ativos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Empreitadas</Text>
              <Text style={styles.statValue}>{estatisticas.empreitadas.total}</Text>
              <Text style={styles.statSubtext}>{estatisticas.empreitadas.ativas} ativas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ferramentas</Text>
              <Text style={styles.statValue}>{estatisticas.ferramentas.total}</Text>
              <Text style={styles.statSubtext}>cadastradas</Text>
            </View>
          </View>
        </View>

        {/* Resumo Financeiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          <View style={styles.financialGrid}>
            <View style={[styles.financialCard, styles.financialCardGreen]}>
              <Text style={styles.financialLabel}>Valor Total Empreitadas</Text>
              <Text style={styles.financialValueGreen}>{formatCurrency(financeiro.valor_empreitadas)}</Text>
            </View>
            <View style={[styles.financialCard, styles.financialCardAmber]}>
              <Text style={styles.financialLabel}>Total Retirado</Text>
              <Text style={styles.financialValueAmber}>{formatCurrency(financeiro.valor_retirado)}</Text>
            </View>
            <View style={[styles.financialCard, styles.financialCardBlue]}>
              <Text style={styles.financialLabel}>Saldo Disponível</Text>
              <Text style={styles.financialValueBlue}>{formatCurrency(financeiro.saldo)}</Text>
            </View>
          </View>
        </View>

        {/* Ferramentas por Localização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição de Ferramentas</Text>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <View style={styles.miniTable}>
                {estatisticas.ferramentas.por_localizacao.map((item, index) => (
                  <View key={index} style={styles.miniTableRow}>
                    <Text style={styles.miniTableLabel}>
                      {item.localizacao === 'CD' ? 'No CD' : 
                       item.localizacao === 'FUNCIONARIO' ? 'Com Funcionários' :
                       item.localizacao === 'MANUTENCAO' ? 'Em Manutenção' : item.localizacao}
                    </Text>
                    <Text style={styles.miniTableValue}>{item.quantidade} un.</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.miniTable}>
                <View style={styles.miniTableRow}>
                  <Text style={styles.miniTableLabel}>Total de Retiradas</Text>
                  <Text style={styles.miniTableValue}>{estatisticas.retiradas.total}</Text>
                </View>
                <View style={styles.miniTableRow}>
                  <Text style={styles.miniTableLabel}>Valor Total Retiradas</Text>
                  <Text style={styles.miniTableValue}>{formatCurrency(estatisticas.retiradas.valor_total)}</Text>
                </View>
                <View style={styles.miniTableRow}>
                  <Text style={styles.miniTableLabel}>Usuários do Sistema</Text>
                  <Text style={styles.miniTableValue}>{estatisticas.usuarios.total}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página 2 - Empreitadas Ativas */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src={VBS_LOGO_BASE64} style={styles.logo} />
            <Text style={styles.companyName}>Via Brasil Sul</Text>
          </View>
          <Text style={styles.title}>Empreitadas Ativas</Text>
          <Text style={styles.subtitle}>{empreitadasAtivas.length} empreitada(s) em andamento</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Empreitada</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Condomínio</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Funcionário</Text>
            <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'right' }]}>Valor</Text>
            <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'right' }]}>Retirado</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Saldo</Text>
          </View>
          {empreitadasAtivas.slice(0, 20).map((emp, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { width: '25%' }]} numberOfLines={1}>{emp.nome}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]} numberOfLines={1}>{emp.condominio}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]} numberOfLines={1}>{emp.funcionario}</Text>
              <Text style={[styles.tableCell, { width: '13%', textAlign: 'right' }]}>{formatCurrency(emp.valor_total)}</Text>
              <Text style={[styles.tableCell, { width: '13%', textAlign: 'right', color: '#d97706' }]}>{formatCurrency(emp.valor_retirado)}</Text>
              <Text style={[styles.tableCell, { width: '14%', textAlign: 'right', color: emp.saldo >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }]}>
                {formatCurrency(emp.saldo)}
              </Text>
            </View>
          ))}
        </View>

        {empreitadasAtivas.length > 20 && (
          <Text style={{ marginTop: 10, fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>
            ... e mais {empreitadasAtivas.length - 20} empreitada(s)
          </Text>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página 3 - Ferramentas e Atividades */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src={VBS_LOGO_BASE64} style={styles.logo} />
            <Text style={styles.companyName}>Via Brasil Sul</Text>
          </View>
          <Text style={styles.title}>Ferramentas Emprestadas</Text>
          <Text style={styles.subtitle}>{ferramentasEmprestadas.length} ferramenta(s) com funcionários</Text>
        </View>

        {ferramentasEmprestadas.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Ferramenta</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Código</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Funcionário</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Obra</Text>
            </View>
            {ferramentasEmprestadas.slice(0, 25).map((fer, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '30%' }]} numberOfLines={1}>{fer.nome}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{fer.codigo}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]} numberOfLines={1}>{fer.funcionario}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]} numberOfLines={1}>{fer.obra || '-'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: '#94a3b8', fontSize: 10 }}>Nenhuma ferramenta emprestada no momento.</Text>
        )}

        {/* Últimas Atividades */}
        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Últimas Atividades do Sistema</Text>
          {ultimasAtividades.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Empreitada</Text>
                <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Ação</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Usuário</Text>
                <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Data</Text>
              </View>
              {ultimasAtividades.slice(0, 10).map((ativ, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCellBold, { width: '30%' }]} numberOfLines={1}>{ativ.empreitada}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{ativ.acao}</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{ativ.usuario}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{formatDateTime(ativ.data)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 10 }}>Nenhuma atividade registrada.</Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página 4 - Resumo por Condomínio */}
      {condominiosResumo.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src={VBS_LOGO_BASE64} style={styles.logo} />
              <Text style={styles.companyName}>Via Brasil Sul</Text>
            </View>
            <Text style={styles.title}>Resumo por Condomínio</Text>
            <Text style={styles.subtitle}>{condominiosResumo.length} condomínio(s) com empreitadas</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Condomínio</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'center' }]}>Empreitadas Ativas</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Valor Total</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Saldo</Text>
            </View>
            {condominiosResumo.map((cond, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '40%' }]} numberOfLines={1}>{cond.nome}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>{cond.empreitadas_ativas}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatCurrency(cond.valor_total)}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right', color: cond.saldo >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }]}>
                  {formatCurrency(cond.saldo)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  )
}
