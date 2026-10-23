-- =====================================================================
-- VoltMap – Esquema do banco de dados (Iterações C1 e C2)
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

-- =====================================================================
-- Iteração C2: avaliações (RF08), fotos dos pontos (RF05), denúncias (RF10),
-- moderação (RF11 / UC05), notificações e gestão de usuários (RF12)
-- ConteudoModeravel (abstrata) -> PontoDeRecarga / Avaliacao / FotoPonto
-- =====================================================================

CREATE TABLE IF NOT EXISTS avaliacao (
  id            SERIAL PRIMARY KEY,
  ponto_id      INTEGER      NOT NULL REFERENCES ponto_de_recarga(id) ON DELETE CASCADE,
  motorista_id  INTEGER      NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nota          SMALLINT     NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario    VARCHAR(500),
  data_hora     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  removida      BOOLEAN      NOT NULL DEFAULT FALSE,     -- remoção pela moderação (UC05 – A1)
  UNIQUE (ponto_id, motorista_id)                         -- uma avaliação por motorista em cada ponto
);
CREATE INDEX IF NOT EXISTS idx_avaliacao_ponto ON avaliacao (ponto_id, data_hora DESC);

CREATE TABLE IF NOT EXISTS foto_ponto (
  id            SERIAL PRIMARY KEY,
  ponto_id      INTEGER      NOT NULL REFERENCES ponto_de_recarga(id) ON DELETE CASCADE,
  motorista_id  INTEGER      NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo_mime     VARCHAR(20)  NOT NULL CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  imagem        BYTEA        NOT NULL,
  data_envio    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  removida      BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_foto_ponto ON foto_ponto (ponto_id, data_envio DESC);

CREATE TABLE IF NOT EXISTS denuncia (
  id                SERIAL PRIMARY KEY,
  denunciante_id    INTEGER      NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  conteudo_tipo     VARCHAR(20)  NOT NULL CHECK (conteudo_tipo IN ('PONTO', 'AVALIACAO', 'FOTO')),
  conteudo_id       INTEGER      NOT NULL,
  motivo            VARCHAR(30)  NOT NULL
                    CHECK (motivo IN ('INFORMACAO_INCORRETA', 'AVALIACAO_INADEQUADA', 'PONTO_INEXISTENTE',
                                      'CONTEUDO_IMPROPRIO', 'OUTRO')),
  descricao         VARCHAR(500),
  status            VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                    CHECK (status IN ('PENDENTE', 'RESOLVIDA', 'ARQUIVADA')),
  acao_tomada       VARCHAR(30)  CHECK (acao_tomada IN ('REMOVER_CONTEUDO', 'SUSPENDER_PONTO', 'ARQUIVAR')),
  administrador_id  INTEGER      REFERENCES usuario(id),
  data_hora         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  resolvida_em      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_denuncia_status ON denuncia (status, data_hora);
-- o mesmo motorista não registra duas denúncias pendentes sobre o mesmo conteúdo
CREATE UNIQUE INDEX IF NOT EXISTS uq_denuncia_pendente
  ON denuncia (denunciante_id, conteudo_tipo, conteudo_id) WHERE status = 'PENDENTE';

CREATE TABLE IF NOT EXISTS notificacao (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER      NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo        VARCHAR(30)  NOT NULL,
  mensagem    VARCHAR(500) NOT NULL,
  lida        BOOLEAN      NOT NULL DEFAULT FALSE,
  data_envio  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notificacao_usuario ON notificacao (usuario_id, data_envio DESC);
