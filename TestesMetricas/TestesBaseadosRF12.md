# Métricas dos Testes baseados no RF12 – Gerenciar Usuários

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | principal (bloquear) | motorista ativo, com sessão aberta | TST032 | Sucesso |
| 2 | principal (desbloquear) | motorista bloqueado | TST033 | Sucesso |
| 3 | exceção | conta de administrador | TST034 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 3**

**$T_i$ (Quantidade de testes implementados) = 3**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 3**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 3**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{3}{3} = 1 = 100\%$
