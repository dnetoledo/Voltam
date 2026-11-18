# Métricas dos Testes

Execução de 17/11/2026. Versão 0.2 (tag v2, commit fed80bb – o mesmo publicado em https://voltmap-u1iy.onrender.com), executada em servidor local com banco de teste recém-criado por npm run db:setup (PostgreSQL 16), navegador Google Chrome, localização fixada em -23.5646, -46.6527 pela emulação de geolocalização do navegador (equivalente à ferramenta Sensores).

## Contagem de cenários e testes (todo o projeto)

**$R_{ft}$ (Requirements for Test) = 34**

**$T_i$ (Quantidade de testes implementados) = 34**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{34}{34} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 34**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{34}{34} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 32**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{32}{34} = 0,94118 = 94,118\%$

## Por caso de uso / requisito

| Caso de uso / requisito | $R_{ft}$ | $T_i$ | $T_x$ | $T_s$ | Cob. implementados | Cob. executados | Cob. bem-sucedidos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [UC01 – Autenticar-se](TestesBaseadosUC01.md) | 4 | 4 | 4 | 4 | 100% | 100% | 100% |
| [UC02 – Buscar Pontos de Recarga Próximos](TestesBaseadosUC02.md) | 5 | 5 | 5 | 4 | 100% | 100% | 80% |
| [UC03 – Cadastrar Novo Ponto de Recarga](TestesBaseadosUC03.md) | 7 | 7 | 7 | 7 | 100% | 100% | 100% |
| [UC04 – Fazer Check-in / Atualizar Status do Ponto](TestesBaseadosUC04.md) | 4 | 4 | 4 | 4 | 100% | 100% | 100% |
| [RF08 – Avaliar Ponto de Recarga](TestesBaseadosRF08.md) | 3 | 3 | 3 | 3 | 100% | 100% | 100% |
| [RF10 – Denunciar Conteúdo](TestesBaseadosRF10.md) | 3 | 3 | 3 | 2 | 100% | 100% | 66,667% |
| [UC05 – Moderar Denúncias](TestesBaseadosUC05.md) | 5 | 5 | 5 | 5 | 100% | 100% | 100% |
| [RF12 – Gerenciar Usuários](TestesBaseadosRF12.md) | 3 | 3 | 3 | 3 | 100% | 100% | 100% |
| **Plano da Aula 4 (UC01–UC04)** | 20 | 20 | 20 | 19 | 100% | 100% | 95% |
| **Total do projeto** | **34** | **34** | **34** | **32** | **100%** | **100%** | **94,118%** |

## Falhas encontradas

- **TST005** – O resumo e a ordem dos 12 pontos estão corretos (Eletroposto Paulista Center com 0 m, Parque Tecnológico Butantã com 8,0 km) e os 12 pontos aparecem no mapa. Porém o segundo ponto, "Hotel Jardins Carregador", aparece com "500 m", e o resultado esperado é "497 m". A distância calculada é de cerca de 497 m, mas a API arredonda a distância para centésimos de km (0,50 km) e a tela a exibe como 500 m. O mesmo valor foi observado no app publicado. Provável erro no resultado esperado do script, e não no sistema: corrigir o item (b) para "500 m" e reexecutar.
- **TST026** – O sistema aceitou a denúncia do próprio ponto: a janela fechou, a página mostrou "Denúncia enviada. Obrigado! Um administrador vai analisar o conteúdo." e o total de denúncias passou de 5 para 6 (denúncia PONTO 13, PENDENTE). Esperado: "Você não pode denunciar um conteúdo que você mesmo enviou." No código, a regra exclui de propósito o tipo PONTO (Motorista.registrarDenuncia), o que contradiz a regra "denúncia do próprio conteúdo" da Tabela 13. O grupo deve decidir se corrige o código ou a especificação.

## Defeitos e observações registrados durante a execução

- **Condição de corrida nos filtros (UC02):** escolhendo dois filtros em menos de 1 segundo, a resposta da busca anterior pode chegar depois e sobrescrever a lista (visto no app publicado, fora do roteiro do TST007).
- **Mensagem de potência (UC03, TST015):** para 1.000,1 kW o sistema diz "maior que zero"; sugere-se mencionar também o limite de 1.000 kW.
- **Bloqueio com sessão aberta (RF12, TST032):** a sessão é encerrada, mas o topo da página em que o bloqueio foi detectado continua mostrando "Olá, Maria" até a próxima navegação.

## Escopo das métricas

$R_{ft}$ conta os cenários de UC01–UC04 (plano da Aula 4) e de RF08, RF10, UC05 e RF12 (acrescentados na Aula 6). Não foram incluídos cenários de criar conta (RF01), favoritos (RF09), envio e denúncia de fotos, recarga ativa e pagamento simulado; se o professor considerar esses itens requisitos para teste, $R_{ft}$ aumenta e a cobertura de testes implementados cai na mesma proporção.
