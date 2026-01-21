import { z } from 'zod'

// ============================================
// VALIDAÇÕES DE RETIRADAS
// ============================================

export const createRetiradaSchema = z.object({
  funcionarioId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ),
  empreitadaId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ),
  valor: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseFloat(v) : v
  ).refine(v => v > 0 && v <= 999999.99, {
    message: 'Valor deve ser positivo e menor que R$ 1.000.000,00'
  }),
  data: z.string().optional(),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
})

export const updateRetiradaSchema = z.object({
  valor: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseFloat(v) : v
  ).refine(v => v > 0 && v <= 999999.99).optional(),
  data: z.string().optional(),
  descricao: z.string().max(500).optional(),
})

// ============================================
// VALIDAÇÕES DE EMPREITADAS
// ============================================

export const createEmpreitadaSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo'),
  valorTotal: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseFloat(v) : v
  ).refine(v => v > 0 && v <= 9999999.99, {
    message: 'Valor deve ser positivo e menor que R$ 10.000.000,00'
  }),
  funcionarioId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ),
  condominioId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ),
  descricao: z.string().max(1000).optional(),
})

export const updateEmpreitadaSchema = z.object({
  nome: z.string().min(3).max(200).optional(),
  valorTotal: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseFloat(v) : v
  ).optional(),
  descricao: z.string().max(1000).optional(),
  concluida: z.boolean().optional(),
})

// ============================================
// VALIDAÇÕES DE FUNCIONÁRIOS
// ============================================

export const createFuncionarioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  telefone: z.string()
    .regex(/^[\d\s\-\(\)]+$/, 'Telefone inválido')
    .optional()
    .nullable(),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
    .optional()
    .nullable(),
  rg: z.string().max(20).optional().nullable(),
  endereco: z.string().max(200).optional().nullable(),
})

// ============================================
// VALIDAÇÕES DE FERRAMENTAS
// ============================================

export const updateFerramentaSchema = z.object({
  acao: z.enum(['devolver', 'emprestar', 'manutencao', 'retornar_cd']).optional(),
  funcionarioId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ).optional(),
  condominioId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ).optional().nullable(),
  obraAtual: z.string().max(200).optional().nullable(),
  observacao: z.string().max(500).optional(),
})

// ============================================
// VALIDAÇÕES DE AUTENTICAÇÃO
// ============================================

export const loginSchema = z.object({
  login: z.string()
    .min(3, 'Login deve ter pelo menos 3 caracteres')
    .max(50, 'Login muito longo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Login deve conter apenas letras, números e _'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
})

// ============================================
// VALIDAÇÕES DE CONTAS A PAGAR
// ============================================

export const createContaPagarSchema = z.object({
  descricao: z.string().min(3).max(200),
  valor: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseFloat(v) : v
  ).refine(v => v > 0 && v <= 9999999.99),
  dataVencimento: z.string().refine(v => !isNaN(Date.parse(v)), {
    message: 'Data de vencimento inválida'
  }),
  categoria: z.string().max(50).optional(),
  fornecedorId: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'string' ? parseInt(v, 10) : v
  ).optional().nullable(),
  observacoes: z.string().max(1000).optional(),
})

// ============================================
// HELPER PARA VALIDAÇÃO
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return { success: false, error: messages.join('; ') }
    }
    return { success: false, error: 'Dados inválidos' }
  }
}
