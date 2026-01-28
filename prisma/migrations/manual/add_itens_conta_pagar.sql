-- Migration: Adicionar tabela de itens da nota fiscal para contas a pagar
-- Data: 2026-01-28
-- Descrição: Tabela para armazenar os itens das notas fiscais vinculadas a contas a pagar

-- Criar tabela de itens
CREATE TABLE IF NOT EXISTS itens_conta_pagar (
  id SERIAL PRIMARY KEY,
  conta_pagar_id INTEGER NOT NULL REFERENCES contas_pagar(id) ON DELETE CASCADE,
  numero_item INTEGER,
  codigo_produto VARCHAR(60),
  descricao VARCHAR(500) NOT NULL,
  ncm VARCHAR(8),
  cfop VARCHAR(4),
  unidade VARCHAR(6),
  quantidade REAL NOT NULL DEFAULT 1,
  valor_unitario REAL NOT NULL DEFAULT 0,
  valor_total REAL NOT NULL DEFAULT 0,
  valor_desconto REAL DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca por conta
CREATE INDEX IF NOT EXISTS idx_itens_conta_pagar_conta ON itens_conta_pagar(conta_pagar_id);

-- Comentário na tabela
COMMENT ON TABLE itens_conta_pagar IS 'Itens das notas fiscais importadas para contas a pagar';
