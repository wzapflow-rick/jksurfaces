-- =============================================================================
-- RADAR JK - FASE 4 - CENTRAL DE CACA
-- =============================================================================
-- IMPORTANTE: execute este SQL conectado ao banco DEDICADO `radar_jk`,
-- NAO no banco `crm` nem em nenhum outro.
--
-- No PgAdmin: clique no banco radar_jk -> Tools -> Query Tool -> cole aqui.
-- Confirme no topo da aba que diz "radar_jk/..." antes de rodar.
--
-- Tudo usa "IF NOT EXISTS" -> seguro para reexecutar.
-- NAO altera nem remove nenhuma tabela existente
-- (radar_opportunities, products, buyers, offers, settings permanecem intactas).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- fornece gen_random_uuid()

-- FONTES DE CACA ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hunt_sources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  type                text NOT NULL DEFAULT 'OUTRO',
  url_base            text,
  search_url_template text,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- MISSOES DE CACA --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hunt_missions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  description         text,
  sku                 text,
  search_term         text NOT NULL,
  brand               text,
  category            text,
  expected_sale_price numeric(12,2) NOT NULL,
  source_ids          uuid[] NOT NULL DEFAULT '{}',
  priority            text NOT NULL DEFAULT 'MEDIA',
  status              text NOT NULL DEFAULT 'ATIVA',
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hunt_missions_status_idx   ON hunt_missions (status);
CREATE INDEX IF NOT EXISTS hunt_missions_priority_idx ON hunt_missions (priority);

-- =============================================================================
-- SEED DAS FONTES PADRAO (idempotente por nome, sem depender de constraint)
-- So tem template de busca as fontes cuja estrutura de pesquisa e publica e
-- conhecida. Loja fisica / Fornecedor / Outro nao tem busca automatica.
-- =============================================================================
INSERT INTO hunt_sources (name, type, url_base, search_url_template)
SELECT s.name, s.type, s.url_base, s.search_url_template
FROM (VALUES
  ('OLX',                  'MARKETPLACE', 'https://www.olx.com.br',              'https://www.olx.com.br/brasil?q={q}'),
  ('Mercado Livre',        'MARKETPLACE', 'https://www.mercadolivre.com.br',     'https://lista.mercadolivre.com.br/{q}'),
  ('Facebook Marketplace', 'MARKETPLACE', 'https://www.facebook.com/marketplace','https://www.facebook.com/marketplace/search/?query={q}'),
  ('Shopee',               'MARKETPLACE', 'https://shopee.com.br',               'https://shopee.com.br/search?keyword={q}'),
  ('Loja física',          'LOJA_FISICA', NULL,                                  NULL),
  ('Fornecedor',           'FORNECEDOR',  NULL,                                  NULL),
  ('Outro',                'OUTRO',       NULL,                                  NULL)
) AS s(name, type, url_base, search_url_template)
WHERE NOT EXISTS (SELECT 1 FROM hunt_sources h WHERE h.name = s.name);
