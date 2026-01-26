'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  pdf,
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
    padding: 35,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  dateText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
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
    gap: 8,
    marginBottom: 15,
  },
  statCard: {
    width: '23%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statSubtext: {
    fontSize: 6,
    color: '#94a3b8',
    marginTop: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 8,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 6,
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
  badgeBlue: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  badgeSlate: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 8,
    color: '#1e3a8a',
    lineHeight: 1.4,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  locationCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
})

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

interface Ferramenta {
  id: number
  codigo: string
  nome: string
  descricao?: string
  categoria?: string
  tipo?: string
  marca?: string
  modelo?: string
  numeroSerie?: string
  dataCompra?: string
  valorCompra?: number
  estadoConservacao?: string
  localizacaoAtual: string
  funcionarioAtual?: string
  obraAtual?: string
  ativo: boolean
}

interface FerramentasData {
  geradoEm: string
  filtros?: {
    localizacao?: string
    funcionario?: string
    categoria?: string
  }
  estatisticas: {
    total: number
    por_localizacao: { localizacao: string; quantidade: number }[]
    por_categoria: { categoria: string; quantidade: number }[]
    emprestadas: number
    no_cd: number
    em_manutencao: number
  }
  ferramentas: Ferramenta[]
}

interface FerramentasPDFProps {
  data: FerramentasData
}

function getLocalizacaoLabel(loc: string): string {
  switch (loc) {
    case 'CD': return 'No CD'
    case 'FUNCIONARIO': return 'Com Funcionário'
    case 'MANUTENCAO': return 'Em Manutenção'
    case 'OBRA': return 'Na Obra'
    default: return loc || 'Não definida'
  }
}

function getLocalizacaoBadgeStyle(loc: string) {
  switch (loc) {
    case 'CD': return styles.badgeGreen
    case 'FUNCIONARIO': return styles.badgeAmber
    case 'MANUTENCAO': return styles.badgeRed
    case 'OBRA': return styles.badgeBlue
    default: return styles.badgeSlate
  }
}

export function FerramentasPDF({ data }: FerramentasPDFProps) {
  const { estatisticas, ferramentas } = data
  
  // Agrupar ferramentas por localização
  const ferramentasCD = ferramentas.filter(f => f.localizacaoAtual === 'CD')
  const ferramentasEmprestadas = ferramentas.filter(f => f.localizacaoAtual === 'FUNCIONARIO')
  const ferramentasManutencao = ferramentas.filter(f => f.localizacaoAtual === 'MANUTENCAO')

  return (
    <Document>
      {/* Página 1 - Resumo */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src={VBS_LOGO_BASE64} style={styles.logo} />
            <Text style={styles.companyName}>Via Brasil Sul</Text>
          </View>
          <Text style={styles.title}>Relatório de Ferramentas</Text>
          <Text style={styles.subtitle}>Gestão de Patrimônio</Text>
          <Text style={styles.dateText}>Gerado em: {formatDateTime(data.geradoEm)}</Text>
        </View>

        {/* Resumo */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>🔧 Resumo do Inventário</Text>
          <Text style={styles.summaryText}>
            Total de {estatisticas.total} ferramenta(s) cadastrada(s). 
            {estatisticas.no_cd} no CD, {estatisticas.emprestadas} emprestada(s) a funcionários
            {estatisticas.em_manutencao > 0 ? ` e ${estatisticas.em_manutencao} em manutenção` : ''}.
          </Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas por Localização</Text>
          <View style={styles.statsGrid}>
            {estatisticas.por_localizacao.map((item, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statLabel}>{getLocalizacaoLabel(item.localizacao)}</Text>
                <Text style={styles.statValue}>{item.quantidade}</Text>
                <Text style={styles.statSubtext}>
                  {((item.quantidade / estatisticas.total) * 100).toFixed(0)}% do total
                </Text>
              </View>
            ))}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Geral</Text>
              <Text style={styles.statValue}>{estatisticas.total}</Text>
              <Text style={styles.statSubtext}>ferramentas</Text>
            </View>
          </View>
        </View>

        {/* Categorias */}
        {estatisticas.por_categoria && estatisticas.por_categoria.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas por Categoria</Text>
            <View style={styles.statsGrid}>
              {estatisticas.por_categoria.slice(0, 8).map((item, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statLabel}>{item.categoria || 'Sem categoria'}</Text>
                  <Text style={styles.statValue}>{item.quantidade}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ferramentas Emprestadas (resumo) */}
        {ferramentasEmprestadas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ferramentas com Funcionários ({ferramentasEmprestadas.length})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Código</Text>
                <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Ferramenta</Text>
                <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Funcionário</Text>
                <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Obra</Text>
              </View>
              {ferramentasEmprestadas.slice(0, 15).map((fer, index) => (
                <View key={fer.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCellBold, { width: '12%' }]}>{fer.codigo}</Text>
                  <Text style={[styles.tableCell, { width: '28%' }]} >{fer.nome}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]} >
                    {fer.funcionarioAtual || '-'}
                  </Text>
                  <Text style={[styles.tableCell, { width: '35%' }]} >
                    {fer.obraAtual || '-'}
                  </Text>
                </View>
              ))}
            </View>
            {ferramentasEmprestadas.length > 15 && (
              <Text style={{ marginTop: 5, fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
                ... e mais {ferramentasEmprestadas.length - 15} ferramenta(s)
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Página 2 - Lista Completa no CD */}
      {ferramentasCD.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src={VBS_LOGO_BASE64} style={styles.logo} />
              <Text style={styles.companyName}>Via Brasil Sul</Text>
            </View>
            <Text style={styles.title}>Ferramentas no CD</Text>
            <Text style={styles.subtitle}>{ferramentasCD.length} ferramenta(s) disponível(is)</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Código</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Nome</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Categoria</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Marca/Modelo</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Estado</Text>
            </View>
            {ferramentasCD.slice(0, 30).map((fer, index) => (
              <View key={fer.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '10%' }]}>{fer.codigo}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]} >{fer.nome}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{fer.categoria || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]} >
                  {fer.marca ? `${fer.marca}${fer.modelo ? ` ${fer.modelo}` : ''}` : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{fer.estadoConservacao || '-'}</Text>
              </View>
            ))}
          </View>

          {ferramentasCD.length > 30 && (
            <Text style={{ marginTop: 8, fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
              ... e mais {ferramentasCD.length - 30} ferramenta(s) no CD
            </Text>
          )}

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </Page>
      )}

      {/* Página 3 - Ferramentas em Manutenção */}
      {ferramentasManutencao.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src={VBS_LOGO_BASE64} style={styles.logo} />
              <Text style={styles.companyName}>Via Brasil Sul</Text>
            </View>
            <Text style={styles.title}>Ferramentas em Manutenção</Text>
            <Text style={styles.subtitle}>{ferramentasManutencao.length} ferramenta(s) em reparo</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Código</Text>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Nome</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Categoria</Text>
              <Text style={[styles.tableHeaderCell, { width: '33%' }]}>Descrição</Text>
            </View>
            {ferramentasManutencao.map((fer, index) => (
              <View key={fer.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '12%' }]}>{fer.codigo}</Text>
                <Text style={[styles.tableCell, { width: '35%' }]} >{fer.nome}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{fer.categoria || '-'}</Text>
                <Text style={[styles.tableCell, { width: '33%' }]} >
                  {fer.descricao || '-'}
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

      {/* Página 4 - Lista Completa (se não houver muitas) */}
      {ferramentas.length <= 50 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src={VBS_LOGO_BASE64} style={styles.logo} />
              <Text style={styles.companyName}>Via Brasil Sul</Text>
            </View>
            <Text style={styles.title}>Inventário Completo</Text>
            <Text style={styles.subtitle}>Todas as {ferramentas.length} ferramenta(s)</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Código</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Nome</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Categoria</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Localização</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Responsável</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Estado</Text>
            </View>
            {ferramentas.map((fer, index) => (
              <View key={fer.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '10%' }]}>{fer.codigo}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]} >{fer.nome}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{fer.categoria || '-'}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>
                  {getLocalizacaoLabel(fer.localizacaoAtual)}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]} >
                  {fer.funcionarioAtual || '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{fer.estadoConservacao || '-'}</Text>
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

export const generateFerramentasPDF = async (data: FerramentasData) => {
  const blob = await pdf(<FerramentasPDF data={data} />).toBlob()
  return blob
}

export default FerramentasPDF
