-- =============================================================================
-- RADAR JK - FASE 6.1 - CAPTURA DE OFERTAS (CHATUBA)
-- =============================================================================
-- IMPORTANTE: execute este SQL conectado ao banco DEDICADO `radar_jk`,
-- NAO no banco `crm` nem em nenhum outro.
--
-- No PgAdmin: clique no banco radar_jk -> Tools -> Query Tool -> cole aqui.
-- Confirme no topo da aba que diz "radar_jk/..." antes de rodar.
--
-- Tudo usa "IF NOT EXISTS" -> seguro para reexecutar (idempotente).
-- NAO altera nem remove nenhuma tabela existente
-- (products, buyers, offers, radar_opportunities, hunt_missions, hunt_sources,
--  hunt_search_queries, settings permanecem intactas).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- fornece gen_random_uuid()

-- OFERTAS CAPTURADAS ----------------------------------------------------------
-- Uma oferta por fonte. O match com o produto JK e persistido junto. Guardamos
-- apenas os dados necessarios para analise (nunca HTML completo); raw_data e um
-- resumo minimo em JSONB.
CREATE TABLE IF NOT EXISTS source_offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source              text NOT NULL,
  external_id         text,
  product_title       text NOT NULL,
  sku                 text,
  ean                 text,
  brand               text,
  url                 text NOT NULL,
  image_url           text,
  price               numeric(12,2) NOT NULL,
  shipping            numeric(12,2),
  availability        integer,
  seller              text,
  captured_at         timestamptz NOT NULL DEFAULT now(),
  match_status        text NOT NULL DEFAULT 'UNMATCHED',
  matched_product_id  uuid REFERENCES products (id) ON DELETE SET NULL,
  match_confidence    numeric(4,3) NOT NULL DEFAULT 0,
  match_method        text NOT NULL DEFAULT 'UNKNOWN',
  raw_data            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- HISTORICO DE PRECO ----------------------------------------------------------
-- Nova entrada apenas quando o preco/frete muda entre capturas.
CREATE TABLE IF NOT EXISTS source_offer_price_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     uuid NOT NULL REFERENCES source_offers (id) ON DELETE CASCADE,
  price        numeric(12,2) NOT NULL,
  shipping     numeric(12,2),
  captured_at  timestamptz NOT NULL DEFAULT now()
);

-- INDICES ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS source_offers_source_idx        ON source_offers (source);
CREATE INDEX IF NOT EXISTS source_offers_sku_idx           ON source_offers (sku);
CREATE INDEX IF NOT EXISTS source_offers_ean_idx           ON source_offers (ean);
CREATE INDEX IF NOT EXISTS source_offers_matched_prod_idx  ON source_offers (matched_product_id);
CREATE INDEX IF NOT EXISTS source_offers_captured_idx      ON source_offers (captured_at DESC);

-- Deduplicacao: um external_id unico por fonte (quando existir external_id).
CREATE UNIQUE INDEX IF NOT EXISTS source_offers_source_external_uq
  ON source_offers (source, external_id)
  WHERE external_id IS NOT NULL;

-- Deduplicacao alternativa por URL quando nao ha external_id.
CREATE UNIQUE INDEX IF NOT EXISTS source_offers_source_url_uq
  ON source_offers (source, url)
  WHERE external_id IS NULL;

CREATE INDEX IF NOT EXISTS source_offer_price_history_offer_idx
  ON source_offer_price_history (offer_id, captured_at DESC);
