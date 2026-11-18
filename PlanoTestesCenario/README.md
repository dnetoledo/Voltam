# Plano de Testes de Cenários – VoltMap v0.2

Prática Profissional em ADS · Aula 4 · Casos de uso UC01, UC02, UC03 e UC04

Os scripts devem ser executados em sequência (TST001 a TST020), num banco de teste recém-criado com `npm run db:setup`. Cada script começa no estado em que o anterior deixou o banco. Na Aula 6 o plano foi ampliado com TST021–TST034, que cobrem o que a Iteração 2 entregou: avaliações (RF08), denúncias (RF10), moderação (UC05) e gestão de usuários (RF12).

| Script | Nome | Caso de uso | Cenário | Resultado esperado | Resultado obtido |
| ------ | ---- | ----------- | ------- | ------------------ | ---------------- |
| [TST001](TST001.md) | Login bem-sucedido | UC01 | Fluxo principal | Acesso liberado | Sucesso |
| [TST002](TST002.md) | Senha incorreta | UC01 | A1 | Mensagem de erro | Sucesso |
| [TST003](TST003.md) | E-mail não cadastrado | UC01 | A1 | Mensagem de erro | Sucesso |
| [TST004](TST004.md) | Conta bloqueada | UC01 | A2 | Mensagem de conta bloqueada | Sucesso |
| [TST005](TST005.md) | Busca pela localização atual | UC02 | Fluxo principal | 12 pontos em 10 km | Falha |
| [TST006](TST006.md) | Busca com raio de 5 km | UC02 | Fluxo principal | 8 pontos em 5 km | Sucesso |
| [TST007](TST007.md) | Busca com filtros de conector e potência | UC02 | Fluxo principal | 2 pontos | Sucesso |
| [TST008](TST008.md) | Nenhum ponto no raio | UC02 | A1 | Sugestão de aumentar o raio | Sucesso |
| [TST009](TST009.md) | Localização não autorizada | UC02 | A2 | Busca por endereço | Sucesso |
| [TST010](TST010.md) | Cadastro bem-sucedido | UC03 | Fluxo principal | Ponto gravado sem alerta | Sucesso |
| [TST011](TST011.md) | Cadastro bem-sucedido (2) | UC03 | Fluxo principal | Ponto gravado | Sucesso |
| [TST012](TST012.md) | Duplicidade: revisar | UC03 | A1 | Alerta; nada gravado | Sucesso |
| [TST013](TST013.md) | Duplicidade: cadastrar mesmo assim | UC03 | A1 | Alerta; ponto gravado | Sucesso |
| [TST014](TST014.md) | Nome curto demais | UC03 | A2 | Mensagem de erro | Sucesso |
| [TST015](TST015.md) | Potência acima do máximo | UC03 | A2 | Mensagem de erro | Sucesso |
| [TST016](TST016.md) | Sem tipo de conector | UC03 | A2 | Mensagem de erro | Sucesso |
| [TST017](TST017.md) | Check-in de ponto ocupado | UC04 | Fluxo principal | Status Ocupado | Sucesso |
| [TST018](TST018.md) | Ponto com defeito | UC04 | A1 | Status Fora de serviço | Sucesso |
| [TST019](TST019.md) | Status ainda válido (1 h 59 min) | UC04 | Fluxo principal | Continua Disponível | Sucesso |
| [TST020](TST020.md) | Status expirado (2 h 1 min) | UC04 | Fluxo principal | Volta a Não verificado | Sucesso |

### Scripts acrescentados na Aula 6

| Script | Nome | Caso de uso | Cenário | Resultado obtido |
| ------ | ---- | ----------- | ------- | ---------------- |
| [TST021](TST021.md) | Avaliação bem-sucedida | RF08 | Fluxo principal | Sucesso |
| [TST022](TST022.md) | Nova avaliação do mesmo motorista | RF08 | Regra: uma avaliação por motorista em cada ponto (Tabela 16) | Sucesso |
| [TST023](TST023.md) | Avaliação sem nota | RF08 | Dados obrigatórios inválidos (nota) | Sucesso |
| [TST024](TST024.md) | Denúncia de avaliação | RF10 | Fluxo principal | Sucesso |
| [TST025](TST025.md) | Denúncia repetida | RF10 | Exceção: denúncia repetida (Tabela 13) | Sucesso |
| [TST026](TST026.md) | Denúncia do próprio conteúdo | RF10 | Exceção: denúncia do próprio conteúdo (Tabela 13) | Falha |
| [TST027](TST027.md) | Painel acessado por motorista | UC05 | Exceção: acesso de quem não é administrador (Tabela 13) | Sucesso |
| [TST028](TST028.md) | Arquivar denúncia | UC05 | Fluxo principal, decisão "arquivar" | Sucesso |
| [TST029](TST029.md) | Remover conteúdo denunciado | UC05 | Extensão A1 – Remover Conteúdo Denunciado (com Enviar Notificação) | Sucesso |
| [TST030](TST030.md) | Suspender ponto | UC05 | Extensão A2 – Suspender Ponto de Recarga | Sucesso |
| [TST031](TST031.md) | Reativar ponto suspenso | UC05 | Pós-condição A2: ponto suspenso até nova verificação (Tabela 16) | Sucesso |
| [TST032](TST032.md) | Bloquear motorista | RF12 | Fluxo principal: bloquear (vale também para sessão já aberta) | Sucesso |
| [TST033](TST033.md) | Desbloquear motorista | RF12 | Fluxo principal: desbloquear | Sucesso |
| [TST034](TST034.md) | Administrador não pode ser bloqueado | RF12 | Exceção: bloquear a si mesmo ou outro administrador (Tabela 13) | Sucesso |

### Execução (Aula 6)

Data: 17/11/2026. Ambiente: Versão 0.2 (tag v2, commit fed80bb – o mesmo publicado em https://voltmap-u1iy.onrender.com), executada em servidor local com banco de teste recém-criado por npm run db:setup (PostgreSQL 16), navegador Google Chrome, localização fixada em -23.5646, -46.6527 pela emulação de geolocalização do navegador (equivalente à ferramenta Sensores).

O TST009 foi executado no app publicado, porque a busca por endereço depende do serviço Nominatim (OpenStreetMap), inacessível no ambiente local.

Métricas: ver [../TestesMetricas/MetricasGerais.md](../TestesMetricas/MetricasGerais.md).
