# Métricas dos Testes

Execução de 17/11/2026, com reexecução em 18/11/2026. Versão 0.2 (tag v2, commit fed80bb – o mesmo publicado em https://voltmap-u1iy.onrender.com), executada em servidor local com banco de teste recém-criado por npm run db:setup (PostgreSQL 16), navegador Google Chrome, localização fixada em -23.5646, -46.6527 pela emulação de geolocalização do navegador (equivalente à ferramenta Sensores).

## Contagem de cenários e testes (todo o projeto)

**$R_{ft}$ (Requirements for Test) = 35**

**$T_i$ (Quantidade de testes implementados) = 35**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{35}{35} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 35**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{35}{35} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 35**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{35}{35} = 1 = 100\%$

## Por caso de uso / requisito

| Caso de uso / requisito | $R_{ft}$ | $T_i$ | $T_x$ | $T_s$ | Cob. implementados | Cob. executados | Cob. bem-sucedidos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [UC01 – Autenticar-se](TestesBaseadosUC01.md) | 4 | 4 | 4 | 4 | 100% | 100% | 100% |
| [UC02 – Buscar Pontos de Recarga Próximos](TestesBaseadosUC02.md) | 5 | 5 | 5 | 5 | 100% | 100% | 100% |
| [UC03 – Cadastrar Novo Ponto de Recarga](TestesBaseadosUC03.md) | 7 | 7 | 7 | 7 | 100% | 100% | 100% |
| [UC04 – Fazer Check-in / Atualizar Status do Ponto](TestesBaseadosUC04.md) | 4 | 4 | 4 | 4 | 100% | 100% | 100% |
| [RF08 – Avaliar Ponto de Recarga](TestesBaseadosRF08.md) | 3 | 3 | 3 | 3 | 100% | 100% | 100% |
| [RF10 – Denunciar Conteúdo](TestesBaseadosRF10.md) | 4 | 4 | 4 | 4 | 100% | 100% | 100% |
| [UC05 – Moderar Denúncias](TestesBaseadosUC05.md) | 5 | 5 | 5 | 5 | 100% | 100% | 100% |
| [RF12 – Gerenciar Usuários](TestesBaseadosRF12.md) | 3 | 3 | 3 | 3 | 100% | 100% | 100% |
| **Plano da Aula 4 (UC01–UC04)** | 20 | 20 | 20 | 20 | 100% | 100% | 100% |
| **Total do projeto** | **35** | **35** | **35** | **35** | **100%** | **100%** | **100%** |

## Histórico de falhas e correções

- **TST005** (17/11/2026, Falha) – A tela mostrou o Hotel Jardins Carregador com "500 m", e o resultado esperado dizia "497 m". Investigação: a busca devolve a distância arredondada para centésimos de km (0,50 km), e a tela a exibe como 500 m; o erro estava no resultado esperado, que usou a distância exata. Correção: item (b) alterado para "500 m" em 18/11/2026.
- **TST026** (17/11/2026, Falha) – Versão anterior do script ("Denúncia do próprio conteúdo"): o motorista denunciou o ponto "Recarga Teste Sul Paulista", que ele mesmo cadastrou, e o sistema aceitou, contrariando a Tabela 13. Investigação: o código (Motorista.registrarDenuncia) permite de propósito que o autor denuncie o próprio ponto; como o app não tem edição nem exclusão de pontos, essa é a única forma de o autor avisar que o local fechou. Decisão do grupo em 18/11/2026: manter o comportamento e ajustar a especificação (Tabelas 13 e 16). O script foi reescrito para a regra que vale para avaliações e fotos, e o TST035 cobre a denúncia do próprio ponto.

Na 1ª execução (17/11/2026), com 34 cenários: $T_s$ = 32, cobertura de bem-sucedidos = 94,118%. Após a investigação, a correção do TST005, a reescrita do TST026 e o novo TST035, a reexecução de 18/11/2026 levou aos números acima.

## Defeitos e observações registrados durante a execução

- **Condição de corrida nos filtros (UC02):** escolhendo dois filtros em menos de 1 segundo, a resposta da busca anterior pode chegar depois e sobrescrever a lista (visto no app publicado, fora do roteiro do TST007).
- **Mensagem de potência (UC03, TST015):** para 1.000,1 kW o sistema diz "maior que zero"; sugere-se mencionar também o limite de 1.000 kW.
- **Bloqueio com sessão aberta (RF12, TST032):** a sessão é encerrada, mas o topo da página em que o bloqueio foi detectado continua mostrando "Olá, Maria" até a próxima navegação.

## Escopo das métricas

$R_{ft}$ conta os cenários de UC01–UC04 (plano da Aula 4) e de RF08, RF10, UC05 e RF12 (acrescentados na Aula 6). Não foram incluídos cenários de criar conta (RF01), favoritos (RF09), envio e denúncia de fotos, recarga ativa e pagamento simulado; se o professor considerar esses itens requisitos para teste, $R_{ft}$ aumenta e a cobertura de testes implementados cai na mesma proporção.
