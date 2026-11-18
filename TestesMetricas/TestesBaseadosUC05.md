# Métricas dos Testes baseados no UC05 – Moderar Denúncias

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | exceção | usuário não é administrador | TST027 | Sucesso |
| 2 | 1,2,3,4 (arquivar) | denúncia pendente, decisão arquivar | TST028 | Sucesso |
| 3 | 1,2,3,4,A1 | avaliação com 2 denúncias, decisão remover conteúdo + notificar autor | TST029 | Sucesso |
| 4 | 1,2,3,4,A2 | ponto denunciado como inexistente, decisão suspender | TST030 | Sucesso |
| 5 | pós-condição A2 | ponto suspenso reativado após verificação | TST031 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 5**

**$T_i$ (Quantidade de testes implementados) = 5**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{5}{5} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 5**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{5}{5} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 5**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{5}{5} = 1 = 100\%$
