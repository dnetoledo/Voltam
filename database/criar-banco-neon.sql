-- VoltMap – Criação do banco no Neon (cole tudo no SQL Editor e clique em Run)

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

-- Usuários de teste (senha: voltmap123)
INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES
  ('Motorista Demonstração', 'motorista@voltmap.com', '$2b$10$I.5KXUAw.AVwXcbpetjiYubpVAmcq91NAdwuITAKjar.BMPEqWDAW', 'MOTORISTA'),
  ('Administrador VoltMap', 'admin@voltmap.com', '$2b$10$I.5KXUAw.AVwXcbpetjiYubpVAmcq91NAdwuITAKjar.BMPEqWDAW', 'ADMINISTRADOR')
ON CONFLICT (email) DO NOTHING;

-- Pontos de recarga de exemplo em São Paulo
INSERT INTO ponto_de_recarga (nome, endereco, latitude, longitude, tipos_conector, potencia_kw, numero_vagas, horario_funcionamento, status, motorista_id)
SELECT v.nome, v.endereco, v.lat, v.lng, v.conectores, v.pot, v.vagas, v.horario, v.status, u.id
FROM (VALUES
  ('Eletroposto Paulista Center', 'Av. Paulista, 1000 – Bela Vista', -23.5646, -46.6527, ARRAY['Tipo 2', 'CCS Combo'], 60, 2, '24 horas', 'DISPONIVEL'),
  ('Recarga Shopping Consolação', 'Rua da Consolação, 2200 – Consolação', -23.5536, -46.6598, ARRAY['Tipo 2'], 22, 4, '10h às 22h', 'OCUPADO'),
  ('Estacionamento Higienópolis', 'Av. Higienópolis, 600 – Higienópolis', -23.5451, -46.6563, ARRAY['Tipo 2'], 7.4, 2, '07h às 23h', 'DISPONIVEL'),
  ('Posto Rápido Rebouças', 'Av. Rebouças, 3000 – Pinheiros', -23.5672, -46.6934, ARRAY['CCS Combo', 'CHAdeMO'], 150, 2, '24 horas', 'DISPONIVEL'),
  ('Supermercado Vila Madalena', 'Rua Fradique Coutinho, 900 – Vila Madalena', -23.5569, -46.689, ARRAY['Tipo 2'], 11, 3, '08h às 22h', 'FORA_DE_SERVICO'),
  ('Hotel Jardins Carregador', 'Alameda Santos, 1500 – Jardins', -23.5638, -46.6575, ARRAY['Tipo 2'], 22, 1, '24 horas', 'NAO_VERIFICADO'),
  ('Eletroposto Ibirapuera', 'Av. República do Líbano, 1100 – Ibirapuera', -23.592, -46.6618, ARRAY['CCS Combo', 'Tipo 2'], 50, 2, '06h às 22h', 'DISPONIVEL'),
  ('Shopping Vila Olímpia', 'Rua Olimpíadas, 360 – Vila Olímpia', -23.5955, -46.6861, ARRAY['Tipo 2', 'CCS Combo'], 60, 6, '10h às 22h', 'DISPONIVEL'),
  ('Centro Empresarial Berrini', 'Av. Eng. Luís Carlos Berrini, 1500 – Brooklin', -23.6072, -46.6955, ARRAY['Tipo 2'], 22, 4, '07h às 20h', 'OCUPADO'),
  ('Estação Mooca Recarga', 'Rua da Mooca, 2500 – Mooca', -23.558, -46.5985, ARRAY['Tipo 2', 'GB/T'], 30, 2, '24 horas', 'DISPONIVEL'),
  ('Eletroposto Santana', 'Av. Cruzeiro do Sul, 2600 – Santana', -23.5025, -46.6245, ARRAY['CCS Combo'], 120, 2, '24 horas', 'NAO_VERIFICADO'),
  ('Parque Tecnológico Butantã', 'Av. Prof. Luciano Gualberto, 300 – Butantã', -23.5613, -46.7309, ARRAY['Tipo 1', 'Tipo 2'], 7.4, 2, '08h às 18h', 'DISPONIVEL')
) AS v(nome, endereco, lat, lng, conectores, pot, vagas, horario, status)
CROSS JOIN (SELECT id FROM usuario WHERE email = 'motorista@voltmap.com') u
WHERE NOT EXISTS (SELECT 1 FROM ponto_de_recarga);

-- Conferência
SELECT (SELECT COUNT(*) FROM usuario) AS usuarios, (SELECT COUNT(*) FROM ponto_de_recarga) AS pontos;
