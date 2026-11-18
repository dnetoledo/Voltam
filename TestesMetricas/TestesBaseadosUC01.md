# Métricas dos Testes baseados no UC01 – Autenticar-se

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | 1,2,3,4 | e-mail cadastrado, senha correta, conta ATIVA | TST001 | Sucesso |
| 2 | 1,2,3,A1 | e-mail cadastrado, senha diferente da cadastrada (1 caractere a menos) | TST002 | Sucesso |
| 3 | 1,2,3,A1 | e-mail não cadastrado | TST003 | Sucesso |
| 4 | 1,2,3,A2 | senha correta, conta BLOQUEADA | TST004 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 4**

**$T_i$ (Quantidade de testes implementados) = 4**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 4**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 4**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{4}{4} = 1 = 100\%$
