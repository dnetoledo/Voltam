-- =====================================================================
-- VoltMap – Esquema do banco de dados (Iteração C1)
-- Derivado do Modelo de Domínio (Seção 9 do Documento de Projeto)
-- Usuario (abstrata) -> Motorista / Administrador: tabela única com "tipo"
-- =====================================================================

CREATE TABLE IF NOT EXISTS usuario (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  senha_hash     VARCHAR(100) NOT NULL,
  tipo           VARCHAR(20)  NOT NULL DEFAULT 'MOTORISTA'
                 CHECK (tipo IN ('MOTORISTA', 'ADMINISTRADOR')),
  status         VARCHAR(20)  NOT NULL DEFAULT 'ATIVO'
                 CHECK (status IN ('ATIVO', 'BLOQUEADO')),
  data_cadastro  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ponto_de_recarga (
  id                     SERIAL PRIMARY KEY,
  nome                   VARCHAR(120)     NOT NULL,
  endereco               VARCHAR(200),
  latitude               DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude              DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  tipos_conector         TEXT[]           NOT NULL,
  potencia_kw            NUMERIC(6,1)     NOT NULL CHECK (potencia_kw > 0),
  numero_vagas           INTEGER          NOT NULL DEFAULT 1 CHECK (numero_vagas > 0),
  horario_funcionamento  VARCHAR(100),
  status                 VARCHAR(20)      NOT NULL DEFAULT 'NAO_VERIFICADO'
                         CHECK (status IN ('NAO_VERIFICADO', 'DISPONIVEL', 'OCUPADO',
                                           'FORA_DE_SERVICO', 'SUSPENSO')),
  motorista_id           INTEGER REFERENCES usuario(id),   -- associação "cadastra"
  data_cadastro          TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ponto_localizacao ON ponto_de_recarga (latitude, longitude);

-- ---------------------------------------------------------------------
-- Iteração C1 (ampliação): check-in (UC04), recarga ativa e favoritos (RF09)
-- ---------------------------------------------------------------------

-- Momento em que o status do ponto foi informado por um check-in (validade de 2 horas)
ALTER TABLE ponto_de_recarga ADD COLUMN IF NOT EXISTS status_atualizado_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS check_in (
  id                SERIAL PRIMARY KEY,
  ponto_id          INTEGER     NOT NULL REFERENCES ponto_de_recarga(id) ON DELETE CASCADE,
  motorista_id      INTEGER     NOT NULL REFERENCES usuario(id),
  status_informado  VARCHAR(20) NOT NULL
                    CHECK (status_informado IN ('DISPONIVEL', 'OCUPADO', 'FORA_DE_SERVICO')),
  comentario        VARCHAR(280),
  carregando        BOOLEAN     NOT NULL DEFAULT FALSE,   -- "recarga ativa" do motorista
  data_hora         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validade          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
  encerrado_em      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_checkin_ponto ON check_in (ponto_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_motorista ON check_in (motorista_id, data_hora DESC);

CREATE TABLE IF NOT EXISTS favorito (
  motorista_id     INTEGER   NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  ponto_id         INTEGER   NOT NULL REFERENCES ponto_de_recarga(id) ON DELETE CASCADE,
  data_adicionado  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (motorista_id, ponto_id)
);

-- ---------------------------------------------------------------------
-- Pagamento da recarga (MODO DEMONSTRAÇÃO – nenhuma cobrança é realizada)
-- Por segurança, do cartão guardamos apenas bandeira, 4 últimos dígitos, validade e titular.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forma_pagamento (
  id            SERIAL PRIMARY KEY,
  motorista_id  INTEGER     NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  bandeira      VARCHAR(20) NOT NULL,
  final_cartao  CHAR(4)     NOT NULL CHECK (final_cartao ~ '^[0-9]{4}$'),
  validade      CHAR(5)     NOT NULL CHECK (validade ~ '^(0[1-9]|1[0-2])/[0-9]{2}$'),
  titular       VARCHAR(80) NOT NULL,
  padrao        BOOLEAN     NOT NULL DEFAULT FALSE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE check_in ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(40);
ALTER TABLE check_in ADD COLUMN IF NOT EXISTS energia_kwh    NUMERIC(8,2);
ALTER TABLE check_in ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(10,2);
