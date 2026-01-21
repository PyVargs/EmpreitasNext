'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface FerramentasData {
  geradoEm: string
  estatisticas: {
    total: number
    por_localizacao: { localizacao: string; quantidade: number }[]
    por_categoria: { categoria: string; quantidade: number }[]
    emprestadas: number
    no_cd: number
    em_manutencao: number
  }
  ferramentas: {
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
  }[]
}

export function FerramentasDownloadButton() {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FerramentasData | null>(null)
  const [PDFModule, setPDFModule] = useState<typeof import('@react-pdf/renderer') | null>(null)
  const [FerramentasModule, setFerramentasModule] = useState<typeof import('./ferramentas-pdf') | null>(null)
  const [modulesLoading, setModulesLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ferramentas/relatorio')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setModulesLoading(true)
        // Carregar módulos PDF dinamicamente
        const [pdf, ferramentas] = await Promise.all([
          import('@react-pdf/renderer'),
          import('./ferramentas-pdf'),
        ])
        setPDFModule(pdf)
        setFerramentasModule(ferramentas)
        setModulesLoading(false)
        toast.success('Relatório pronto para download!')
      } else {
        toast.error(result.error || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloaded = () => {
    setTimeout(() => {
      setData(null)
      setPDFModule(null)
      setFerramentasModule(null)
    }, 500)
  }

  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        <FileText className="mr-2 h-4 w-4" />
        Gerar Relatório PDF
      </Button>
    )
  }

  if (data && PDFModule && FerramentasModule && !modulesLoading) {
    const { PDFDownloadLink } = PDFModule
    const { FerramentasPDF } = FerramentasModule

    return (
      <PDFDownloadLink
        document={<FerramentasPDF data={data} />}
        fileName={`relatorio-ferramentas-${new Date().toISOString().split('T')[0]}.pdf`}
      >
        {({ loading: pdfLoading }) => (
          <Button
            variant="outline"
            disabled={pdfLoading}
            onClick={() => {
              if (!pdfLoading) {
                handleDownloaded()
              }
            }}
          >
            {pdfLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Relatório
              </>
            )}
          </Button>
        )}
      </PDFDownloadLink>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleGenerateReport}
      disabled={loading || modulesLoading}
    >
      {loading || modulesLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparando...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório PDF
        </>
      )}
    </Button>
  )
}
