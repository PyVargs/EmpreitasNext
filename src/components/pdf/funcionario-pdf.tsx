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

// Registrar fonte (Helvetica padrão)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#0891b2',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#64748b',
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
  },
  summaryBox: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValueGreen: {
    color: '#22c55e',
  },
  summaryValueAmber: {
    color: '#f59e0b',
  },
  summaryValueCyan: {
    color: '#0891b2',
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
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlternate: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  tableCellRed: {
    color: '#ef4444',
  },
  tableCellGreen: {
    color: '#22c55e',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    fontSize: 8,
    color: '#94a3b8',
  },
  badge: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    padding: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 8,
  },
  badgeInactive: {
    backgroundColor: '#64748b',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  totalCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  noData: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 20,
    fontStyle: 'italic',
  },
})

interface Empreitada {
  id: number
  nome: string
  valorTotal: number
  concluida: boolean
  condominio?: { nome: string }
  retiradas?: { valor: number }[]
}

interface Retirada {
  id: number
  valor: number
  data: string
  descricao?: string
  empreitada?: { nome: string }
}

interface FuncionarioData {
  nome: string
  telefone?: string
  cpf?: string
  rg?: string
  endereco?: string
  ativo: boolean
  total_empreitadas: number
  total_retirado: number
  saldo: number
  empreitadas: Empreitada[]
  retiradas: Retirada[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return '-'
  }
}

const FuncionarioPDF = ({ funcionario }: { funcionario: FuncionarioData }) => {
  const empreitadasAtivas = funcionario.empreitadas.filter((e) => !e.concluida)
  const empreitadasConcluidas = funcionario.empreitadas.filter((e) => e.concluida)
  
  const empreitadasComSaldo = funcionario.empreitadas.map((e) => {
    const valorRetirado = e.retiradas?.reduce((acc, r) => acc + r.valor, 0) || 0
    return {
      ...e,
      valor_retirado: valorRetirado,
      saldo_restante: e.valorTotal - valorRetirado,
    }
  })
  
  const totaisAtivas = empreitadasComSaldo
    .filter((e) => !e.concluida)
    .reduce(
      (acc, e) => ({
        valor: acc.valor + e.valorTotal,
        retirado: acc.retirado + e.valor_retirado,
        saldo: acc.saldo + e.saldo_restante,
      }),
      { valor: 0, retirado: 0, saldo: 0 }
    )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src={VBS_LOGO_BASE64} style={styles.logo} />
            <Text style={styles.companyName}>Via Brasil Sul</Text>
          </View>
          <Text style={styles.title}>{funcionario.nome}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.subtitle}>Relatório do Funcionário</Text>
            <View style={funcionario.ativo ? styles.badge : [styles.badge, styles.badgeInactive]}>
              <Text>{funcionario.ativo ? 'Ativo' : 'Inativo'}</Text>
            </View>
          </View>
        </View>

        {/* Resumo */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>TOTAL EM EMPREITADAS</Text>
            <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
              {formatCurrency(funcionario.total_empreitadas)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>TOTAL RETIRADO</Text>
            <Text style={[styles.summaryValue, styles.summaryValueAmber]}>
              {formatCurrency(funcionario.total_retirado)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>SALDO DISPONÍVEL</Text>
            <Text style={[styles.summaryValue, styles.summaryValueCyan]}>
              {formatCurrency(funcionario.saldo)}
            </Text>
          </View>
        </View>

        {/* Empreitadas Ativas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Empreitadas Ativas ({empreitadasAtivas.length})</Text>
          {empreitadasAtivas.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Condomínio</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Obra</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valor</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Retirado</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Saldo</Text>
              </View>
              {empreitadasComSaldo
                .filter((e) => !e.concluida)
                .map((emp, index) => (
                  <View
                    key={emp.id}
                    style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { flex: 2 }]}>
                      {emp.condominio?.nome || '-'}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{emp.nome}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {formatCurrency(emp.valorTotal)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {formatCurrency(emp.valor_retirado)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1, textAlign: 'right' },
                        emp.saldo_restante < 0 ? styles.tableCellRed : styles.tableCellGreen,
                      ]}
                    >
                      {formatCurrency(emp.saldo_restante)}
                    </Text>
                  </View>
                ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalCell, { flex: 2 }]}>Total Ativas</Text>
                <Text style={[styles.totalCell, { flex: 2 }]}></Text>
                <Text style={[styles.totalCell, { flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(totaisAtivas.valor)}
                </Text>
                <Text style={[styles.totalCell, { flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(totaisAtivas.retirado)}
                </Text>
                <Text style={[styles.totalCell, { flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(totaisAtivas.saldo)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>Nenhuma empreitada ativa</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
          <Text>Gerado em: {new Date().toLocaleString('pt-BR')}</Text>
        </View>
      </Page>

      {/* Segunda página - Retiradas */}
      {funcionario.retiradas.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Image src={VBS_LOGO_BASE64} style={styles.logo} />
              <Text style={styles.companyName}>Via Brasil Sul</Text>
            </View>
            <Text style={styles.title}>{funcionario.nome}</Text>
            <Text style={styles.subtitle}>Histórico de Retiradas</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Últimas Retiradas ({funcionario.retiradas.length})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: 70 }]}>Data</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Empreitada</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Descrição</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valor</Text>
              </View>
              {funcionario.retiradas.slice(0, 30).map((ret, index) => (
                <View
                  key={ret.id}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                >
                  <Text style={[styles.tableCell, { width: 70 }]}>{formatDate(ret.data)}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {ret.empreitada?.nome || '-'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{ret.descricao || '-'}</Text>
                  <Text
                    style={[styles.tableCell, { flex: 1, textAlign: 'right', color: '#f59e0b' }]}
                  >
                    {formatCurrency(ret.valor)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalCell, { width: 70 }]}>Total</Text>
                <Text style={[styles.totalCell, { flex: 2 }]}></Text>
                <Text style={[styles.totalCell, { flex: 2 }]}></Text>
                <Text style={[styles.totalCell, { flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(funcionario.retiradas.reduce((acc, r) => acc + r.valor, 0))}
                </Text>
              </View>
            </View>
          </View>

          {/* Empreitadas Concluídas */}
          {empreitadasConcluidas.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Empreitadas Concluídas ({empreitadasConcluidas.length})
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Condomínio</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Obra</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valor</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Retirado</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Saldo</Text>
                </View>
                {empreitadasComSaldo
                  .filter((e) => e.concluida)
                  .slice(0, 20)
                  .map((emp, index) => (
                    <View
                      key={emp.id}
                      style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                    >
                      <Text style={[styles.tableCell, { flex: 2 }]}>
                        {emp.condominio?.nome || '-'}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{emp.nome}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                        {formatCurrency(emp.valorTotal)}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                        {formatCurrency(emp.valor_retirado)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { flex: 1, textAlign: 'right' },
                          emp.saldo_restante < 0 ? styles.tableCellRed : styles.tableCellGreen,
                        ]}
                      >
                        {formatCurrency(emp.saldo_restante)}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Via Brasil Sul - Sistema de Gestão de Obras | por Eduardo Vargas</Text>
            <Text>Gerado em: {new Date().toLocaleString('pt-BR')}</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}

export const generateFuncionarioPDF = async (funcionario: FuncionarioData) => {
  const blob = await pdf(<FuncionarioPDF funcionario={funcionario} />).toBlob()
  return blob
}

export default FuncionarioPDF
