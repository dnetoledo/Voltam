-- =====================================================================
-- VoltMap – Consultas diretas para demonstrar a persistência (Aula 3)
-- Execute no SQL Editor do Neon depois de usar a aplicação publicada.
-- =====================================================================

-- 1. Usuários cadastrados (a conta criada pela tela de cadastro aparece aqui)
SELECT id, nome, email, tipo, status, data_cadastro
FROM usuario
ORDER BY data_cadastro DESC;

-- 2. Senhas estão protegidas com hash bcrypt (RNF de segurança)
SELECT email, LEFT(senha_hash, 7) AS inicio_do_hash
FROM usuario;

-- 3. Pontos de recarga mais recentes (o ponto cadastrado pela aplicação aparece aqui)
SELECT p.id, p.nome, p.endereco, p.tipos_conector, p.potencia_kw,
       p.status, u.nome AS cadastrado_por, p.data_cadastro
FROM ponto_de_recarga p
LEFT JOIN usuario u ON u.id = p.motorista_id
ORDER BY p.data_cadastro DESC
LIMIT 10;

-- 4. Pontos novos entram como "não verificados" (pós-condição do UC03)
SELECT status, COUNT(*) AS quantidade
FROM ponto_de_recarga
GROUP BY status;

-- 5. Pontos cadastrados por cada motorista
SELECT u.nome, COUNT(p.id) AS pontos_cadastrados
FROM usuario u
LEFT JOIN ponto_de_recarga p ON p.motorista_id = u.id
GROUP BY u.nome
ORDER BY pontos_cadastrados DESC;
