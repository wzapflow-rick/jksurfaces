-- =============================================================================
-- RADAR JK - FASE 6.3 - IMPORTACAO INTELIGENTE DE ANUNCIOS (OLX)
-- =============================================================================
-- IMPORTANTE: execute este SQL conectado ao banco DEDICADO `radar_jk`,
-- NAO no banco `crm` nem em nenhum outro.
--
-- No PgAdmin: clique no banco radar_jk -> Tools -> Query Tool -> cole aqui.
-- Confirme no topo da aba que diz "radar_jk/..." antes de rodar.
--
-- Esta migration NAO cria tabela nova: a estrutura da Fase 6.1 (source_offers /
-- source_offer_price_history) e reaproveitada. Apenas ACRESCENTA colunas para a
-- importacao inteligente (quantidade, preco unitario, lote, condicao, preco
-- negociavel, localizacao, observacoes e a origem por campo).
--
-- Tudo usa "ADD COLUMN IF NOT EXISTS" -> seguro para reexecutar (idempotente).
-- NAO altera nem remove nenhuma coluna existente.
-- =============================================================================

-- CAMPOS DE IMPORTACAO EM source_offers ---------------------------------------
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS quantity          integer NOT NULL DEFAULT 1;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS unit_price        numeric(12,2);
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS is_lot            boolean NOT NULL DEFAULT false;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS condition         text;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS price_negotiable  boolean NOT NULL DEFAULT false;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS location          text;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS notes             text;
ALTER TABLE source_offers ADD COLUMN IF NOT EXISTS field_origins     jsonb;

-- VERIFICACAO -----------------------------------------------------------------
-- Deve listar as 8 colunas novas.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'source_offers'
  AND column_name IN (
    'quantity', 'unit_price', 'is_lot', 'condition',
    'price_negotiable', 'location', 'notes', 'field_origins'
  )
ORDER BY column_name;
