# Métricas dos Testes baseados no UC03 – Cadastrar Novo Ponto de Recarga

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | 1,2,3,4,5 | ponto mais próximo a 51,2 m (> 50 m), dados válidos | TST010 | Sucesso |
| 2 | 1,2,3,4,5 | nome com 3 caracteres (mínimo) e potência = 1.000 kW (máximo) | TST011 | Sucesso |
| 3 | 1,2,3,4,A1 | ponto a 48,9 m (≤ 50 m), motorista escolhe "Revisar" | TST012 | Sucesso |
| 4 | 1,2,3,4,A1,5 | ponto a 48,9 m (≤ 50 m), motorista escolhe "Cadastrar mesmo assim" | TST013 | Sucesso |
| 5 | 1,2,3,4,A2 | nome com 2 caracteres (< 3) | TST014 | Sucesso |
| 6 | 1,2,3,4,A2 | potência = 1.000,1 kW (> 1.000) | TST015 | Sucesso |
| 7 | 1,2,3,4,A2 | nenhum tipo de conector | TST016 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 7**

**$T_i$ (Quantidade de testes implementados) = 7**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{7}{7} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 7**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{7}{7} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 7**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{7}{7} = 1 = 100\%$
