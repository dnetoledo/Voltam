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

-- ===================== Iteração C2 =====================

-- 6. RF08 – nota média e total de avaliações por ponto (avaliações removidas não contam)
SELECT p.nome, ROUND(AVG(a.nota), 1) AS nota_media, COUNT(a.id) AS avaliacoes
FROM ponto_de_recarga p
JOIN avaliacao a ON a.ponto_id = p.id AND NOT a.removida
GROUP BY p.nome
ORDER BY nota_media DESC;

-- 7. RF10 / UC05 – denúncias por situação e decisão do administrador
SELECT status, acao_tomada, conteudo_tipo, COUNT(*) AS quantidade
FROM denuncia
GROUP BY status, acao_tomada, conteudo_tipo
ORDER BY status;

-- 8. UC05 – fila de moderação: denúncias pendentes, mais antigas primeiro
SELECT d.id, d.conteudo_tipo, d.conteudo_id, d.motivo, d.descricao, u.nome AS denunciante, d.data_hora
FROM denuncia d JOIN usuario u ON u.id = d.denunciante_id
WHERE d.status = 'PENDENTE'
ORDER BY d.data_hora;

-- 9. UC05 – A2: pontos suspensos (não aparecem nas buscas)
SELECT id, nome, endereco, status_atualizado_em FROM ponto_de_recarga WHERE status = 'SUSPENSO';

-- 10. Notificações enviadas aos autores de conteúdo removido
SELECT u.nome, n.mensagem, n.lida, n.data_envio
FROM notificacao n JOIN usuario u ON u.id = n.usuario_id
ORDER BY n.data_envio DESC;

-- 11. RF12 – usuários bloqueados
SELECT nome, email, tipo FROM usuario WHERE status = 'BLOQUEADO';

-- 12. Fotos por ponto (a imagem fica na coluna BYTEA "imagem")
SELECT p.nome, COUNT(f.id) AS fotos, pg_size_pretty(SUM(octet_length(f.imagem))) AS tamanho
FROM ponto_de_recarga p JOIN foto_ponto f ON f.ponto_id = p.id AND NOT f.removida
GROUP BY p.nome;
