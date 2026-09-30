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
