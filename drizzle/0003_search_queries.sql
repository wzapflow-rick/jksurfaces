-- =============================================================================
-- RADAR JK - FASE 5 - INTELIGENCIA DE BUSCA
-- =============================================================================
-- IMPORTANTE: execute este SQL conectado ao banco DEDICADO `radar_jk`,
-- NAO no banco `crm` nem em nenhum outro.
--
-- No PgAdmin: clique no banco radar_jk -> Tools -> Query Tool -> cole aqui.
-- Confirme no topo da aba que diz "radar_jk/..." antes de rodar.
--
-- Tudo usa "IF NOT EXISTS" -> seguro para reexecutar.
-- NAO altera nem remove nenhuma tabela existente
-- (hunt_missions, hunt_sources, radar_opportunities, products, buyers, offers,
--  settings permanecem intactas).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- fornece gen_random_uuid()

-- CONSULTAS INTELIGENTES -------------------------------------------------------
-- Cada consulta pertence a uma missao. Ao excluir a missao, as consultas sao
-- removidas em cascata. source_id fica preparado para consultas por fonte.
CREATE TABLE IF NOT EXISTS hunt_search_queries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  uuid NOT NULL REFERENCES hunt_missions (id) ON DELETE CASCADE,
  source_id   uuid,
  query       text NOT NULL,
  type        text NOT NULL,
  priority    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- INDICES ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS hunt_search_queries_mission_idx  ON hunt_search_queries (mission_id);
CREATE INDEX IF NOT EXISTS hunt_search_queries_source_idx   ON hunt_search_queries (source_id);
CREATE INDEX IF NOT EXISTS hunt_search_queries_priority_idx ON hunt_search_queries (priority DESC);
