# Métricas dos Testes baseados no UC04 – Fazer Check-in / Atualizar Status do Ponto

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | 1,2,3,4,5 | status Ocupado com comentário | TST017 | Sucesso |
| 2 | 1,2,3,4,A1 | status Fora de serviço (ponto com defeito) | TST018 | Sucesso |
| 3 | 1,2,3,4,5 | status Disponível, consultado 1 h 59 min depois (< 2 h) | TST019 | Sucesso |
| 4 | 1,2,3,4,5 | status Disponível, consultado 2 h 1 min depois (> 2 h) | TST020 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 4**

**$T_i$ (Quantidade de testes implementados) = 4**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 4**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 4**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{4}{4} = 1 = 100\%$
