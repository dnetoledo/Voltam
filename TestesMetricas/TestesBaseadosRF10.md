# Métricas dos Testes baseados no RF10 – Denunciar Conteúdo

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | principal | avaliação de outro motorista, ainda não denunciada | TST024 | Sucesso |
| 2 | exceção | denúncia repetida do mesmo conteúdo | TST025 | Sucesso |
| 3 | regra | avaliação do próprio motorista: sem opção de denúncia | TST026 | Sucesso |
| 4 | principal (regra) | autor denuncia o próprio ponto (local fechou) | TST035 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 4**

**$T_i$ (Quantidade de testes implementados) = 4**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 4**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{4}{4} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 4**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{4}{4} = 1 = 100\%$
