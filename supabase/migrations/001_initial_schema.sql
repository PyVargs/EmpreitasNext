-- ============================================================================
-- EMPREITAS 2.0 - Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Usuários (gerenciado pelo Supabase Auth, mas com tabela de perfil)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    admin BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcionários
CREATE TABLE funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Condomínios
CREATE TABLE condominios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    endereco TEXT NOT NULL,
    sindico VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empreitadas
CREATE TABLE empreitadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    descricao TEXT,
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
    condominio_id UUID REFERENCES condominios(id),
    concluida BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retiradas
CREATE TABLE retiradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valor DECIMAL(12,2) NOT NULL,
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    descricao TEXT,
    empreitada_id UUID NOT NULL REFERENCES empreitadas(id) ON DELETE CASCADE,
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contratos
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID NOT NULL REFERENCES condominios(id),
    nome_servico VARCHAR(200) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    valor_original DECIMAL(12,2) NOT NULL,
    entrada_obra DECIMAL(12,2) DEFAULT 0,
    area_total DECIMAL(10,2),
    tipo_pagamento VARCHAR(20) DEFAULT 'parcelas' CHECK (tipo_pagamento IN ('parcelas', 'medicoes')),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parcelas
CREATE TABLE parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    valor_parcela DECIMAL(12,2) NOT NULL,
    valor_original DECIMAL(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    intervalo_dias INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'em_atraso', 'cancelada')),
    data_pagamento DATE,
    valor_pago DECIMAL(12,2),
    observacoes TEXT,
    editado_manualmente BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contrato_id, numero_parcela)
);

-- Medições de Obra
CREATE TABLE medicoes_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
    area_executada DECIMAL(10,2) NOT NULL,
    percentual_executado DECIMAL(5,2) NOT NULL,
    valor_medicao DECIMAL(12,2) NOT NULL,
    observacoes TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    data_pagamento DATE,
    valor_pago DECIMAL(12,2),
    status_pagamento VARCHAR(20) DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'atrasado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ferramentas
CREATE TABLE ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    tipo VARCHAR(100) DEFAULT 'S/N',
    categoria VARCHAR(100) DEFAULT 'S/N',
    descricao TEXT,
    localizacao_atual VARCHAR(20) DEFAULT 'CD' CHECK (localizacao_atual IN ('CD', 'FUNCIONARIO', 'MANUTENCAO')),
    funcionario_atual_id UUID REFERENCES funcionarios(id),
    condominio_id UUID REFERENCES condominios(id),
    data_ultimo_emprestimo TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Ferramentas
CREATE TABLE historico_ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ferramenta_id UUID NOT NULL REFERENCES ferramentas(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('EMPRESTIMO', 'DEVOLUCAO_CD', 'MANUTENCAO', 'CADASTRO', 'CONFIRMACAO_POSICAO')),
    funcionario_id UUID REFERENCES funcionarios(id),
    condominio_id UUID REFERENCES condominios(id),
    detalhes TEXT,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    unidade VARCHAR(20) DEFAULT 'un',
    preco_unitario DECIMAL(12,2) DEFAULT 0,
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    estoque_atual DECIMAL(10,2) DEFAULT 0,
    fornecedor_padrao_id UUID REFERENCES fornecedores(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de Materiais
CREATE TABLE pedidos_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empreitada_id UUID REFERENCES empreitadas(id),
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    data_prevista_entrega DATE,
    data_entrega_real DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'em_transito', 'entregue', 'cancelado')),
    observacoes TEXT,
    valor_total DECIMAL(12,2) DEFAULT 0,
    responsavel_pedido VARCHAR(100),
    fornecedor_id UUID REFERENCES fornecedores(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do Pedido
CREATE TABLE itens_pedido_material (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos_materiais(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    descricao VARCHAR(200) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(20) DEFAULT 'un',
    valor_unitario DECIMAL(12,2) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    quantidade_entregue DECIMAL(10,2) DEFAULT 0,
    quantidade_pendente DECIMAL(10,2) NOT NULL,
    status_entrega VARCHAR(20) DEFAULT 'pendente' CHECK (status_entrega IN ('pendente', 'parcial', 'entregue')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas a Pagar
CREATE TABLE contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
    categoria VARCHAR(50),
    fornecedor_id UUID REFERENCES fornecedores(id),
    observacoes TEXT,
    nota_fiscal_url TEXT,
    metodo_pagamento VARCHAR(50),
    conta_bancaria VARCHAR(100),
    numero_nota VARCHAR(50),
    serie_nota VARCHAR(10),
    chave_nfe VARCHAR(44) UNIQUE,
    natureza_operacao VARCHAR(100),
    valor_produtos DECIMAL(12,2),
    valor_servicos DECIMAL(12,2),
    valor_frete DECIMAL(12,2),
    valor_desconto DECIMAL(12,2),
    valor_impostos DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Empreitadas (Auditoria)
CREATE TABLE historico_empreitadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empreitada_id UUID NOT NULL REFERENCES empreitadas(id),
    usuario_id UUID REFERENCES usuarios(id),
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    motivo TEXT,
    ip_usuario VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);

CREATE INDEX idx_condominios_nome ON condominios(nome);
CREATE INDEX idx_condominios_cnpj ON condominios(cnpj);

CREATE INDEX idx_empreitadas_funcionario ON empreitadas(funcionario_id);
CREATE INDEX idx_empreitadas_condominio ON empreitadas(condominio_id);
CREATE INDEX idx_empreitadas_concluida ON empreitadas(concluida);

CREATE INDEX idx_retiradas_empreitada ON retiradas(empreitada_id);
CREATE INDEX idx_retiradas_funcionario ON retiradas(funcionario_id);
CREATE INDEX idx_retiradas_data ON retiradas(data);

CREATE INDEX idx_contratos_condominio ON contratos(condominio_id);
CREATE INDEX idx_contratos_status ON contratos(status);

CREATE INDEX idx_parcelas_contrato ON parcelas(contrato_id);
CREATE INDEX idx_parcelas_vencimento ON parcelas(data_vencimento);
CREATE INDEX idx_parcelas_status ON parcelas(status);

CREATE INDEX idx_ferramentas_codigo ON ferramentas(codigo);
CREATE INDEX idx_ferramentas_localizacao ON ferramentas(localizacao_atual);
CREATE INDEX idx_ferramentas_funcionario ON ferramentas(funcionario_atual_id);

CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_condominios_updated_at BEFORE UPDATE ON condominios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empreitadas_updated_at BEFORE UPDATE ON empreitadas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parcelas_updated_at BEFORE UPDATE ON parcelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicoes_obra_updated_at BEFORE UPDATE ON medicoes_obra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ferramentas_updated_at BEFORE UPDATE ON ferramentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_materiais_updated_at BEFORE UPDATE ON pedidos_materiais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itens_pedido_material_updated_at BEFORE UPDATE ON itens_pedido_material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View de funcionários com totais calculados
CREATE OR REPLACE VIEW vw_funcionarios_saldo AS
SELECT 
    f.id,
    f.nome,
    f.telefone,
    f.cpf,
    f.ativo,
    COALESCE(SUM(e.valor_total), 0) as total_empreitadas,
    COALESCE(SUM(r.valor), 0) as total_retirado,
    COALESCE(SUM(e.valor_total), 0) - COALESCE(SUM(r.valor), 0) as saldo
FROM funcionarios f
LEFT JOIN empreitadas e ON e.funcionario_id = f.id AND e.concluida = FALSE
LEFT JOIN retiradas r ON r.funcionario_id = f.id
GROUP BY f.id, f.nome, f.telefone, f.cpf, f.ativo;

-- View de empreitadas com valores calculados
CREATE OR REPLACE VIEW vw_empreitadas_saldo AS
SELECT 
    e.id,
    e.nome,
    e.valor_total,
    e.descricao,
    e.funcionario_id,
    e.condominio_id,
    e.concluida,
    e.created_at,
    COALESCE(SUM(r.valor), 0) as valor_retirado,
    e.valor_total - COALESCE(SUM(r.valor), 0) as saldo_restante,
    CASE WHEN e.valor_total > 0 
        THEN (COALESCE(SUM(r.valor), 0) / e.valor_total) * 100 
        ELSE 0 
    END as percentual_pago
FROM empreitadas e
LEFT JOIN retiradas r ON r.empreitada_id = e.id
GROUP BY e.id, e.nome, e.valor_total, e.descricao, e.funcionario_id, e.condominio_id, e.concluida, e.created_at;

-- View de ferramentas com dias emprestada
CREATE OR REPLACE VIEW vw_ferramentas_status AS
SELECT 
    f.*,
    CASE 
        WHEN f.localizacao_atual = 'FUNCIONARIO' AND f.data_ultimo_emprestimo IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_emprestimo)::INTEGER
        ELSE 0
    END as dias_emprestada,
    func.nome as funcionario_nome,
    c.nome as condominio_nome
FROM ferramentas f
LEFT JOIN funcionarios func ON func.id = f.funcionario_atual_id
LEFT JOIN condominios c ON c.id = f.condominio_id;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empreitadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_empreitadas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (leitura)
CREATE POLICY "Usuários autenticados podem ler funcionários" ON funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler condomínios" ON condominios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler empreitadas" ON empreitadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler retiradas" ON retiradas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler contratos" ON contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler parcelas" ON parcelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler medições" ON medicoes_obra FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler ferramentas" ON ferramentas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler histórico ferramentas" ON historico_ferramentas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler fornecedores" ON fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler produtos" ON produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler pedidos" ON pedidos_materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler itens pedido" ON itens_pedido_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler contas" ON contas_pagar FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem ler histórico empreitadas" ON historico_empreitadas FOR SELECT TO authenticated USING (true);

-- Políticas para INSERT/UPDATE/DELETE (todos os usuários autenticados por enquanto)
CREATE POLICY "Usuários autenticados podem inserir funcionários" ON funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar funcionários" ON funcionarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar funcionários" ON funcionarios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir condomínios" ON condominios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar condomínios" ON condominios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar condomínios" ON condominios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir empreitadas" ON empreitadas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar empreitadas" ON empreitadas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar empreitadas" ON empreitadas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir retiradas" ON retiradas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem deletar retiradas" ON retiradas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir contratos" ON contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar contratos" ON contratos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir parcelas" ON parcelas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar parcelas" ON parcelas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir medições" ON medicoes_obra FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar medições" ON medicoes_obra FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir ferramentas" ON ferramentas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar ferramentas" ON ferramentas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar ferramentas" ON ferramentas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir histórico ferramentas" ON historico_ferramentas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem inserir fornecedores" ON fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar fornecedores" ON fornecedores FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir produtos" ON produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar produtos" ON produtos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir pedidos" ON pedidos_materiais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar pedidos" ON pedidos_materiais FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir itens pedido" ON itens_pedido_material FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar itens pedido" ON itens_pedido_material FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar itens pedido" ON itens_pedido_material FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir contas" ON contas_pagar FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar contas" ON contas_pagar FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar contas" ON contas_pagar FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir histórico empreitadas" ON historico_empreitadas FOR INSERT TO authenticated WITH CHECK (true);

-- Política para usuários (perfil próprio)
CREATE POLICY "Usuários podem ver próprio perfil" ON usuarios FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);
