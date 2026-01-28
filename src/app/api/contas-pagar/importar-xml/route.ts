import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Interface para item da nota
interface ItemNFe {
  numeroItem: number
  codigoProduto?: string
  descricao: string
  ncm?: string
  cfop?: string
  unidade?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  valorDesconto?: number
}

// Função para extrair dados do XML de NF-e
function parseNFeXML(xmlContent: string): {
  chaveNfe?: string
  numeroNota?: string
  serieNota?: string
  dataEmissao?: Date
  fornecedor?: {
    cnpj?: string
    razaoSocial?: string
    nomeFantasia?: string
  }
  valor?: number
  valorProdutos?: number
  valorServicos?: number
  valorFrete?: number
  valorDesconto?: number
  naturezaOperacao?: string
  itens: ItemNFe[]
} | null {
  try {
    // Parse simples de XML usando regex (para evitar dependências externas)
    const getTagValue = (xml: string, tag: string): string | undefined => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
      const match = xml.match(regex)
      return match ? match[1].trim() : undefined
    }

    // Buscar informações da NF-e
    const chaveNfe = getTagValue(xmlContent, 'chNFe') || xmlContent.match(/Id="NFe(\d{44})"/)?.[1]
    const numeroNota = getTagValue(xmlContent, 'nNF')
    const serieNota = getTagValue(xmlContent, 'serie')
    const dataEmissaoStr = getTagValue(xmlContent, 'dhEmi') || getTagValue(xmlContent, 'dEmi')
    const naturezaOperacao = getTagValue(xmlContent, 'natOp')

    // Dados do emitente (fornecedor)
    const emitMatch = xmlContent.match(/<emit>([\s\S]*?)<\/emit>/i)
    const emitXml = emitMatch ? emitMatch[1] : ''
    const cnpjEmit = getTagValue(emitXml, 'CNPJ')
    const razaoSocial = getTagValue(emitXml, 'xNome')
    const nomeFantasia = getTagValue(emitXml, 'xFant')

    // Valores totais
    const totalMatch = xmlContent.match(/<total>([\s\S]*?)<\/total>/i)
    const totalXml = totalMatch ? totalMatch[1] : ''
    const icmsTotMatch = totalXml.match(/<ICMSTot>([\s\S]*?)<\/ICMSTot>/i)
    const icmsTotXml = icmsTotMatch ? icmsTotMatch[1] : ''

    const valorNF = getTagValue(icmsTotXml, 'vNF')
    const valorProd = getTagValue(icmsTotXml, 'vProd')
    const valorFrete = getTagValue(icmsTotXml, 'vFrete')
    const valorDesc = getTagValue(icmsTotXml, 'vDesc')

    // Valor de serviços (se houver)
    const issqnTotMatch = totalXml.match(/<ISSQNtot>([\s\S]*?)<\/ISSQNtot>/i)
    const issqnTotXml = issqnTotMatch ? issqnTotMatch[1] : ''
    const valorServ = getTagValue(issqnTotXml, 'vServ')

    // Extrair itens da nota fiscal - múltiplos formatos de XML
    const itens: ItemNFe[] = []
    
    // Tentar diferentes padrões de regex para o elemento det
    // Padrão 1: <det nItem="1"> (aspas duplas)
    // Padrão 2: <det nItem='1'> (aspas simples)
    // Padrão 3: Qualquer atributo com nItem
    const detRegexPatterns = [
      /<det\s+nItem\s*=\s*"(\d+)"[^>]*>([\s\S]*?)<\/det>/gi,
      /<det\s+nItem\s*=\s*'(\d+)'[^>]*>([\s\S]*?)<\/det>/gi,
      /<det[^>]*nItem\s*=\s*["']?(\d+)["']?[^>]*>([\s\S]*?)<\/det>/gi,
    ]
    
    let detMatches: RegExpMatchArray[] = []
    for (const pattern of detRegexPatterns) {
      const matches = [...xmlContent.matchAll(pattern)]
      if (matches.length > 0) {
        detMatches = matches
        break
      }
    }
    
    // Se ainda não encontrou, tentar buscar todos os <det> e extrair nItem depois
    if (detMatches.length === 0) {
      const allDetMatches = xmlContent.matchAll(/<det[^>]*>([\s\S]*?)<\/det>/gi)
      let itemNum = 0
      for (const match of allDetMatches) {
        itemNum++
        const detXml = match[1]
        const nItemMatch = match[0].match(/nItem\s*=\s*["']?(\d+)["']?/i)
        const numeroItem = nItemMatch ? parseInt(nItemMatch[1]) : itemNum
        
        const prodMatch = detXml.match(/<prod>([\s\S]*?)<\/prod>/i)
        const prodXml = prodMatch ? prodMatch[1] : ''
        
        if (prodXml) {
          const codigoProduto = getTagValue(prodXml, 'cProd')
          const descricao = getTagValue(prodXml, 'xProd') || 'Produto sem descrição'
          const ncm = getTagValue(prodXml, 'NCM')
          const cfop = getTagValue(prodXml, 'CFOP')
          const unidade = getTagValue(prodXml, 'uCom') || getTagValue(prodXml, 'uTrib')
          const quantidade = parseFloat(getTagValue(prodXml, 'qCom') || getTagValue(prodXml, 'qTrib') || '1')
          const valorUnitario = parseFloat(getTagValue(prodXml, 'vUnCom') || getTagValue(prodXml, 'vUnTrib') || '0')
          const valorTotal = parseFloat(getTagValue(prodXml, 'vProd') || '0')
          const valorDesconto = parseFloat(getTagValue(prodXml, 'vDesc') || '0')
          
          itens.push({
            numeroItem,
            codigoProduto,
            descricao,
            ncm,
            cfop,
            unidade,
            quantidade,
            valorUnitario,
            valorTotal,
            valorDesconto: valorDesconto > 0 ? valorDesconto : undefined,
          })
        }
      }
    } else {
      for (const detMatch of detMatches) {
        const numeroItem = parseInt(detMatch[1])
        const detXml = detMatch[2]
        
        // Dados do produto
        const prodMatch = detXml.match(/<prod>([\s\S]*?)<\/prod>/i)
        const prodXml = prodMatch ? prodMatch[1] : ''
        
        const codigoProduto = getTagValue(prodXml, 'cProd')
        const descricao = getTagValue(prodXml, 'xProd') || 'Produto sem descrição'
        const ncm = getTagValue(prodXml, 'NCM')
        const cfop = getTagValue(prodXml, 'CFOP')
        const unidade = getTagValue(prodXml, 'uCom') || getTagValue(prodXml, 'uTrib')
        const quantidade = parseFloat(getTagValue(prodXml, 'qCom') || getTagValue(prodXml, 'qTrib') || '1')
        const valorUnitario = parseFloat(getTagValue(prodXml, 'vUnCom') || getTagValue(prodXml, 'vUnTrib') || '0')
        const valorTotal = parseFloat(getTagValue(prodXml, 'vProd') || '0')
        const valorDesconto = parseFloat(getTagValue(prodXml, 'vDesc') || '0')

        itens.push({
          numeroItem,
          codigoProduto,
          descricao,
          ncm,
          cfop,
          unidade,
          quantidade,
          valorUnitario,
          valorTotal,
          valorDesconto: valorDesconto > 0 ? valorDesconto : undefined,
        })
      }
    }
    
    console.log(`[XML Parser] Encontrados ${itens.length} itens na nota`)

    return {
      chaveNfe: chaveNfe?.replace(/[^0-9]/g, ''),
      numeroNota,
      serieNota,
      dataEmissao: dataEmissaoStr ? new Date(dataEmissaoStr) : undefined,
      fornecedor: {
        cnpj: cnpjEmit,
        razaoSocial,
        nomeFantasia,
      },
      valor: valorNF ? parseFloat(valorNF) : undefined,
      valorProdutos: valorProd ? parseFloat(valorProd) : undefined,
      valorServicos: valorServ ? parseFloat(valorServ) : undefined,
      valorFrete: valorFrete ? parseFloat(valorFrete) : undefined,
      valorDesconto: valorDesc ? parseFloat(valorDesc) : undefined,
      naturezaOperacao,
      itens,
    }
  } catch (error) {
    console.error('Erro ao parsear XML:', error)
    return null
  }
}

// POST /api/contas-pagar/importar-xml - Importar XML de NF-e
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let prisma
    try {
      const prismaModule = await import('@/lib/prisma')
      prisma = prismaModule.default
    } catch {
      return NextResponse.json({ success: false, error: 'Banco não configurado' })
    }

    // Ler o arquivo XML
    const formData = await req.formData()
    const xmlFile = formData.get('xml') as File
    
    if (!xmlFile) {
      return NextResponse.json({ success: false, error: 'Arquivo XML não enviado' })
    }

    const xmlContent = await xmlFile.text()
    
    // Parsear o XML
    const nfeData = parseNFeXML(xmlContent)
    
    if (!nfeData) {
      return NextResponse.json({ success: false, error: 'Não foi possível ler os dados do XML' })
    }

    if (!nfeData.valor) {
      return NextResponse.json({ success: false, error: 'Valor da nota não encontrado no XML' })
    }

    // Verificar se já existe uma conta com essa chave NFe
    if (nfeData.chaveNfe) {
      const contaExistente = await prisma.contaPagar.findFirst({
        where: { chaveNfe: nfeData.chaveNfe },
      })

      if (contaExistente) {
        return NextResponse.json({ 
          success: false, 
          error: `Nota fiscal já importada anteriormente (Conta #${contaExistente.id})` 
        })
      }
    }

    // Buscar ou criar fornecedor
    let fornecedorId: number | null = null
    if (nfeData.fornecedor?.cnpj) {
      // Formatar CNPJ
      const cnpjFormatado = nfeData.fornecedor.cnpj.replace(/[^0-9]/g, '')
      
      // Buscar fornecedor existente
      let fornecedor = await prisma.fornecedor.findFirst({
        where: { cnpjCpf: cnpjFormatado },
      })

      // Se não existir, criar novo
      if (!fornecedor && nfeData.fornecedor.razaoSocial) {
        fornecedor = await prisma.fornecedor.create({
          data: {
            nome: nfeData.fornecedor.nomeFantasia || nfeData.fornecedor.razaoSocial,
            cnpjCpf: cnpjFormatado,
            ativo: true,
            dataCriacao: new Date(),
          },
        })
      }

      if (fornecedor) {
        fornecedorId = fornecedor.id
      }
    }

    // Criar a descrição da conta
    const descricao = nfeData.fornecedor?.razaoSocial 
      ? `NF ${nfeData.numeroNota || 'S/N'} - ${nfeData.fornecedor.razaoSocial}`
      : `Nota Fiscal ${nfeData.numeroNota || 'S/N'}`

    // Definir data de vencimento (30 dias após emissão por padrão)
    const dataVencimento = nfeData.dataEmissao 
      ? new Date(nfeData.dataEmissao.getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Criar a conta a pagar
    const novaConta = await prisma.contaPagar.create({
      data: {
        descricao,
        valor: nfeData.valor,
        dataVencimento,
        status: 'pendente',
        categoria: 'Material de Construção', // Categoria padrão
        fornecedorId,
        numeroNota: nfeData.numeroNota,
        serie_nota: nfeData.serieNota,
        chaveNfe: nfeData.chaveNfe,
        data_emissao_nota: nfeData.dataEmissao,
        valor_produtos: nfeData.valorProdutos,
        valor_servicos: nfeData.valorServicos,
        valor_frete: nfeData.valorFrete,
        valor_desconto: nfeData.valorDesconto,
        natureza_operacao: nfeData.naturezaOperacao,
        dataCriacao: new Date(),
      },
    })

    // Tentar criar os itens separadamente
    let itensImportados = 0
    let erroItens = ''
    
    console.log(`[Importar XML] Itens encontrados no XML: ${nfeData.itens.length}`)
    if (nfeData.itens.length > 0) {
      console.log('[Importar XML] Primeiro item:', JSON.stringify(nfeData.itens[0]))
    }
    
    if (nfeData.itens.length > 0) {
      try {
        for (const item of nfeData.itens) {
          console.log(`[Importar XML] Inserindo item: ${item.descricao}`)
          await prisma.$executeRaw`
            INSERT INTO itens_conta_pagar 
            (conta_pagar_id, numero_item, codigo_produto, descricao, ncm, cfop, unidade, quantidade, valor_unitario, valor_total, valor_desconto)
            VALUES 
            (${novaConta.id}, ${item.numeroItem}, ${item.codigoProduto || null}, ${item.descricao}, ${item.ncm || null}, ${item.cfop || null}, ${item.unidade || null}, ${item.quantidade}, ${item.valorUnitario}, ${item.valorTotal}, ${item.valorDesconto || 0})
          `
          itensImportados++
          console.log(`[Importar XML] Item inserido com sucesso`)
        }
      } catch (itemError: any) {
        erroItens = itemError?.message || 'Erro desconhecido'
        console.error('[Importar XML] Erro ao inserir item:', itemError)
      }
    }

    const mensagemItens = itensImportados > 0 ? ` (${itensImportados} itens)` : ''
    
    return NextResponse.json({
      success: true,
      message: `Nota Fiscal ${nfeData.numeroNota || ''} importada com sucesso!${mensagemItens}`,
      data: {
        id: novaConta.id.toString(),
        descricao,
        valor: nfeData.valor,
        fornecedor: nfeData.fornecedor?.razaoSocial,
        dataVencimento: dataVencimento.toISOString(),
        totalItens: itensImportados,
        itensEncontrados: nfeData.itens.length,
        erroItens: erroItens || undefined,
      },
    })
  } catch (error) {
    console.error('Erro ao importar XML:', error)
    return NextResponse.json({ success: false, error: 'Erro ao processar arquivo XML' })
  }
}
