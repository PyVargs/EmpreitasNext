'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'

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

interface RelatorioDownloadButtonProps {
  data: RelatorioData
  onDownloaded?: () => void
}

export function RelatorioDownloadButton({ data, onDownloaded }: RelatorioDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false)
  const [PDFModule, setPDFModule] = useState<typeof import('@react-pdf/renderer') | null>(null)
  const [RelatorioModule, setRelatorioModule] = useState<typeof import('./relatorio-sistema-pdf') | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    Promise.all([
      import('@react-pdf/renderer'),
      import('./relatorio-sistema-pdf'),
    ]).then(([pdf, relatorio]) => {
      setPDFModule(pdf)
      setRelatorioModule(relatorio)
      setLoading(false)
    })
  }, [])

  if (!isClient || loading || !PDFModule || !RelatorioModule) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    )
  }

  const { PDFDownloadLink } = PDFModule
  const { RelatorioSistemaPDF } = RelatorioModule

  return (
    <PDFDownloadLink
      document={<RelatorioSistemaPDF data={data} />}
      fileName={`relatorio-sistema-${new Date().toISOString().split('T')[0]}.pdf`}
    >
      {({ loading: pdfLoading }) => (
        <Button
          variant="outline"
          disabled={pdfLoading}
          onClick={() => {
            if (!pdfLoading && onDownloaded) {
              setTimeout(onDownloaded, 500)
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
