# Métricas dos Testes baseados no RF10 – Denunciar Conteúdo

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | principal | avaliação de outro motorista, ainda não denunciada | TST024 | Sucesso |
| 2 | exceção | denúncia repetida do mesmo conteúdo | TST025 | Sucesso |
| 3 | exceção | conteúdo enviado pelo próprio motorista | TST026 | Falha |

**$R_{ft}$ (Requirements for Test) = 3**

**$T_i$ (Quantidade de testes implementados) = 3**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 3**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{3}{3} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 2**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{2}{3} = 0,66667 = 66,667\%$

Falhas: TST026 (ver descrição no script).
