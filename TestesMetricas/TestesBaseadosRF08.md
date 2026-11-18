# Métricas dos Testes baseados no RF08 – Avaliar Ponto de Recarga

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | principal | primeira avaliação do motorista no ponto, nota 4 | TST021 | Sucesso |
| 2 | principal (regra) | segunda avaliação do mesmo motorista no mesmo ponto | TST022 | Sucesso |
| 3 | exceção | sem nota | TST023 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 3**

**$T_i$ (Quantidade de testes implementados) = 3**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 3**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 3**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{3}{3} = 1 = 100\%$
