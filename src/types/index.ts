/**
 * Empreitas 2.0 - Tipos TypeScript
 * 
 * Este arquivo contém todas as interfaces/tipos para o sistema.
 * Baseado no schema PostgreSQL com UUIDs.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type StatusEmpreitada = 'ativa' | 'concluida';

export type StatusParcela = 'pendente' | 'paga' | 'vencida' | 'em_atraso' | 'cancelada';

export type StatusPagamentoMedicao = 'pendente' | 'pago' | 'atrasado';

export type StatusPedido = 'pendente' | 'aprovado' | 'em_transito' | 'entregue' | 'cancelado';

export type StatusEntrega = 'pendente' | 'parcial' | 'entregue';

export type StatusConta = 'Pendente' | 'Pago' | 'Atrasado';

export type LocalizacaoFerramenta = 'CD' | 'FUNCIONARIO' | 'MANUTENCAO';

export type TipoHistoricoFerramenta = 'EMPRESTIMO' | 'DEVOLUCAO_CD' | 'MANUTENCAO' | 'CADASTRO' | 'CONFIRMACAO_POSICAO';

export type TipoPagamentoContrato = 'parcelas' | 'medicoes';

export type StatusContrato = 'ativo' | 'pausado' | 'finalizado' | 'cancelado';

// ============================================================================
// ENTIDADES PRINCIPAIS
// ============================================================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string | null;
  admin: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  endereco?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Computed
  total_empreitadas?: number;
  total_retirado?: number;
  saldo?: number;
}

export interface Condominio {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  sindico: string;
  telefone?: string | null;
  email?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Empreitada {
  id: string;
  nome: string;
  valor_total: number;
  descricao?: string | null;
  funcionario_id: string;
  condominio_id?: string | null;
  concluida: boolean;
  data_conclusao?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  valor_retirado?: number;
  saldo_restante?: number;
  percentual_pago?: number;
  // Relations
  funcionario?: Funcionario;
  condominio?: Condominio;
  retiradas?: Retirada[];
}

export interface Retirada {
  id: string;
  valor: number;
  data: string;
  descricao?: string | null;
  empreitada_id: string;
  funcionario_id: string;
  created_at?: string;
  // Relations
  empreitada?: Empreitada;
  funcionario?: Funcionario;
}

export interface Contrato {
  id: string;
  condominio_id: string;
  nome_servico: string;
  valor_total: number;
  valor_original: number;
  entrada_obra?: number;
  area_total?: number | null;
  tipo_pagamento: TipoPagamentoContrato;
  data_inicio: string;
  data_fim?: string | null;
  status: StatusContrato;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  valor_pago?: number;
  valor_pendente?: number;
  parcelas_pagas?: number;
  parcelas_pendentes?: number;
  parcelas_vencidas?: number;
  percentual_pago?: number;
  percentual_obra_executada?: number;
  // Relations
  condominio?: Condominio;
  parcelas?: Parcela[];
  medicoes_obra?: MedicaoObra[];
}

export interface Parcela {
  id: string;
  contrato_id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_original: number;
  data_vencimento: string;
  intervalo_dias: number;
  status: StatusParcela;
  data_pagamento?: string | null;
  valor_pago?: number | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  dias_vencimento?: number;
  dias_atraso?: number;
}

export interface MedicaoObra {
  id: string;
  contrato_id: string;
  data_medicao: string;
  area_executada: number;
  percentual_executado: number;
  valor_medicao: number;
  observacoes?: string | null;
  usuario_id: string;
  data_pagamento?: string | null;
  valor_pago?: number | null;
  status_pagamento: StatusPagamentoMedicao;
  created_at?: string;
  updated_at?: string;
  // Computed
  area_restante?: number;
  percentual_restante?: number;
  is_pago?: boolean;
  valor_restante?: number;
}

export interface Ferramenta {
  id: string;
  codigo: string;
  nome: string;
  marca?: string | null;
  tipo?: string;
  categoria?: string;
  descricao?: string | null;
  localizacao_atual: LocalizacaoFerramenta;
  funcionario_atual_id?: string | null;
  condominio_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  dias_emprestada?: number;
  // Relations
  funcionario_atual?: Funcionario;
  condominio?: Condominio;
  historico?: HistoricoFerramenta[];
}

export interface HistoricoFerramenta {
  id: string;
  ferramenta_id: string;
  tipo: TipoHistoricoFerramenta;
  detalhes?: string | null;
  observacao?: string | null;
  created_at?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj_cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Produto {
  id: string;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  unidade: string;
  preco_unitario: number;
  estoque_minimo: number;
  estoque_atual: number;
  fornecedor_padrao_id?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Computed
  estoque_baixo?: boolean;
  nome_completo?: string;
  // Relations
  fornecedor_padrao?: Fornecedor;
}

export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  created_at?: string;
}

export interface PedidoMaterial {
  id: string;
  empreitada_id?: string | null;
  numero_pedido: string;
  data_prevista_entrega?: string | null;
  data_entrega_real?: string | null;
  status: StatusPedido;
  observacoes?: string | null;
  valor_total: number;
  responsavel_pedido?: string | null;
  fornecedor_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  total_itens?: number;
  valor_total_calculado?: number;
  status_display?: string;
  atrasado?: boolean;
  // Relations
  empreitada?: Empreitada;
  fornecedor?: Fornecedor;
  itens?: ItemPedidoMaterial[];
}

export interface ItemPedidoMaterial {
  id: string;
  pedido_id: string;
  produto_id?: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
  observacoes?: string | null;
  quantidade_entregue: number;
  quantidade_pendente: number;
  status_entrega: StatusEntrega;
  created_at?: string;
  updated_at?: string;
  // Relations
  produto?: Produto;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: StatusConta;
  categoria?: string | null;
  fornecedor_id?: string | null;
  observacoes?: string | null;
  nota_fiscal_url?: string | null;
  metodo_pagamento?: string | null;
  conta_bancaria?: string | null;
  numero_nota?: string | null;
  serie_nota?: string | null;
  chave_nfe?: string | null;
  natureza_operacao?: string | null;
  valor_produtos?: number | null;
  valor_servicos?: number | null;
  valor_frete?: number | null;
  valor_desconto?: number | null;
  valor_impostos?: number | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  fornecedor?: Fornecedor;
}

export interface HistoricoEmpreitada {
  id: string;
  empreitada_id: string;
  usuario_id?: string | null;
  campo_alterado: string;
  valor_anterior?: string | null;
  valor_novo?: string | null;
  motivo?: string | null;
  ip_usuario?: string | null;
  created_at?: string;
  // Relations
  usuario?: Usuario;
}

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

// Create DTOs
export interface CreateFuncionarioDTO {
  nome: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  endereco?: string;
}

export interface UpdateFuncionarioDTO extends Partial<CreateFuncionarioDTO> {
  ativo?: boolean;
}

export interface CreateEmpreitadaDTO {
  nome: string;
  valor_total: number;
  descricao?: string;
  funcionario_id: string;
  condominio_id?: string;
}

export interface UpdateEmpreitadaDTO extends Partial<CreateEmpreitadaDTO> {
  concluida?: boolean;
}

export interface CreateRetiradaDTO {
  valor: number;
  descricao?: string;
  empreitada_id: string;
  funcionario_id: string;
  data?: string;
}

export interface CreateCondominioDTO {
  nome: string;
  cnpj: string;
  endereco: string;
  sindico: string;
  telefone?: string;
  email?: string;
}

export interface UpdateCondominioDTO extends Partial<CreateCondominioDTO> {
  ativo?: boolean;
}

export interface CreateContratoDTO {
  condominio_id: string;
  nome_servico: string;
  valor_total: number;
  entrada_obra?: number;
  area_total?: number;
  tipo_pagamento: TipoPagamentoContrato;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
  // Para geração de parcelas
  numero_parcelas?: number;
  intervalo_dias?: number;
  dia_vencimento?: number;
}

export interface CreateFerramentaDTO {
  nome: string;
  marca?: string;
  tipo?: string;
  categoria?: string;
  descricao?: string;
}

export interface EmprestarFerramentaDTO {
  ferramenta_codigo: string;
  funcionario_id: string;
  condominio_id?: string;
  observacao?: string;
}

export interface CreateFornecedorDTO {
  nome: string;
  cnpj_cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

export interface CreatePedidoMaterialDTO {
  empreitada_id?: string;
  data_prevista_entrega?: string;
  observacoes?: string;
  responsavel_pedido?: string;
  fornecedor_id?: string;
  itens: CreateItemPedidoDTO[];
}

export interface CreateItemPedidoDTO {
  produto_id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  observacoes?: string;
}

export interface CreateContaPagarDTO {
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string;
  fornecedor_id?: string;
  observacoes?: string;
  metodo_pagamento?: string;
  conta_bancaria?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// Dashboard Stats
export interface DashboardStats {
  valor_total_empreitadas: number;
  valor_total_retirado: number;
  saldo_disponivel: number;
  ferramentas_cd: number;
  ferramentas_emprestadas: number;
  ferramentas_manutencao: number;
  total_funcionarios: number;
  total_condominios: number;
  total_contratos_ativos: number;
  empreitadas_ativas: number;
  empreitadas_concluidas: number;
  contas_vencendo_hoje: number;
  contas_atrasadas: number;
}

export interface FuncionarioStats {
  id: string;
  nome: string;
  total_empreitadas: number;
  total_retirado: number;
  saldo: number;
  empreitadas_ativas: number;
}

export interface ContratoStats {
  parcelas_vencendo_hoje: number;
  parcelas_vencidas: number;
  proximos_vencimentos: Parcela[];
  recebimentos_mes: number;
  total_pendente: number;
}

// ============================================================================
// FILTROS
// ============================================================================

export interface FuncionarioFilters {
  search?: string;
  ativo?: boolean;
}

export interface EmpreitadaFilters {
  search?: string;
  funcionario_id?: string;
  condominio_id?: string;
  concluida?: boolean;
}

export interface FerramentaFilters {
  search?: string;
  localizacao?: LocalizacaoFerramenta;
  funcionario_id?: string;
  tipo?: string;
  categoria?: string;
}

export interface ContratoFilters {
  search?: string;
  condominio_id?: string;
  status?: StatusContrato;
  tipo_pagamento?: TipoPagamentoContrato;
}

export interface ContaPagarFilters {
  search?: string;
  status?: StatusConta;
  fornecedor_id?: string;
  categoria?: string;
  data_inicio?: string;
  data_fim?: string;
}
