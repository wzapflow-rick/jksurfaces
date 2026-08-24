-- =============================================================================
-- RADAR JK - FASE 1 - Criacao das tabelas
-- =============================================================================
-- IMPORTANTE: execute este SQL conectado ao banco DEDICADO `radar_jk`,
-- NAO no banco `crm` nem em nenhum outro.
--
-- No PgAdmin: clique no banco radar_jk -> Tools -> Query Tool -> cole aqui.
-- Confirme no topo da aba que diz "radar_jk/..." antes de rodar.
--
-- Tudo usa "IF NOT EXISTS" -> seguro para reexecutar.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- fornece gen_random_uuid()

-- PRODUTOS ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            text NOT NULL UNIQUE,
  name           text NOT NULL,
  ean            text,
  price_b2b      numeric(12,2) NOT NULL,
  current_cost   numeric(12,2) NOT NULL,
  priority       text NOT NULL DEFAULT 'NORMAL',
  manual_status  text,
  monthly_demand integer,
  min_qty        integer,
  max_qty        integer,
  notes          text,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- COMPRADORES ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buyers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  company    text,
  phone      text,
  email      text,
  active     boolean NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RELACAO COMPRADOR <-> PRODUTO ------------------------------------------------
CREATE TABLE IF NOT EXISTS buyer_products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  max_price  numeric(12,2),
  min_qty    integer,
  max_qty    integer,
  frequency  text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- OFERTAS / OPORTUNIDADES MANUAIS ----------------------------------------------
CREATE TABLE IF NOT EXISTS offers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source        text NOT NULL,
  url           text,
  price         numeric(12,2) NOT NULL,
  available_qty integer,
  shipping      numeric(12,2) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- PREPARADAS PARA AS PROXIMAS FASES (ficam vazias na Fase 1) -------------------
CREATE TABLE IF NOT EXISTS opportunities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_id   uuid REFERENCES offers(id) ON DELETE SET NULL,
  status     text,
  score      integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source      text,
  price       numeric(12,2) NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text,
  status      text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- CONFIGURACOES (linha unica) --------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id         text PRIMARY KEY DEFAULT 'default',
  cost_pct   numeric(5,2) NOT NULL DEFAULT 62,
  margin_pct numeric(5,2) NOT NULL DEFAULT 30,
  tax_pct    numeric(5,2) NOT NULL DEFAULT 8,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DOS 12 PRODUTOS REAIS DA JK (idempotente)
-- =============================================================================
INSERT INTO products (sku, name, ean, price_b2b, current_cost) VALUES
  ('1877.C33',    'Misturador de Mesa Bica Alta Polo Deca',                                                    '7894200160885',  650, 400),
  ('2271.C72',    'Misturador Monocomando de Mesa P Cozinha Spin Deca Cromado',                                '7894200214199',  700, 400),
  ('1785.C',      'Torneira de Mesa Touchless Bica Baixa para Lavatório Deca Cromado',                         '7894203003189', 1500, 1000),
  ('1176.C',      'Torneira para Lavatório de Parede Embutida Decamatic Eco Automática',                       '7894200180852',  350, 200),
  ('1172.C.LNK',  'Torneira Deca de Mesa com Fechamento Automático para Lavatório Decamatic Link Cromado',     '7894200132837',  550, 300),
  ('1173.C',      'Torneira de Mesa para Lavatório Mesa Automática Deca',                                      '7894200122548',  350, 200),
  ('2289.CFD',    'Misturador Monocomando de Mesa para Cozinha Deca Colore',                                   '7894203019463', 1750, 1200),
  ('2280.C',      'Misturador Monocomando para Cozinha de Mesa Gourmet Cromado Deca',                          '7894200149613', 2650, 2000),
  ('1877.C.DSC',  'Misturador de Mesa Bica Alta para Lavatório Disco Deca',                                    '7894200747604',  720, 380),
  ('1173.C.CONF', 'Decamatic Eco Conforto Cromado',                                                            '7894200176817',  750, 450),
  ('1189.CFD',    'Torneira de Mesa para Cozinha Deca Colore',                                                 '7894203019340', 1500, 1000),
  ('1180.C',      'Torneira de Mesa com Sensor Bivolt para Lavatório Decalux',                                 '7894200107194', 2200, 1800)
ON CONFLICT (sku) DO NOTHING;
