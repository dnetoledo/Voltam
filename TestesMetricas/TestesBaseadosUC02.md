# Métricas dos Testes baseados no UC02 – Buscar Pontos de Recarga Próximos

## Contagem de cenários e testes

| Contagem | Cenário | Condições | Script | Resultado |
| -------- | ------- | --------- | ------ | --------- |
| 1 | 1,2,3,4,5,6 | localização autorizada, sem filtros, raio padrão 10 km | TST005 | Falha |
| 2 | 1,2,3,4,5,6 | raio de 5 km (último ponto a 4,8 km incluído; 5,6 km excluído) | TST006 | Sucesso |
| 3 | 1,2,3,4,5,6 | conector CCS Combo e potência ≥ 100 kW | TST007 | Sucesso |
| 4 | 1,2,3,4,A1 | nenhum ponto no raio (Tipo 1, 5 km) e raio < 50 km | TST008 | Sucesso |
| 5 | 1,A2,4,5 | localização não autorizada, busca por endereço | TST009 | Sucesso |

**$R_{ft}$ (Requirements for Test) = 5**

**$T_i$ (Quantidade de testes implementados) = 5**

Cobertura de Testes (implementados) = $\frac{T_i}{R_{ft}} = \frac{5}{5} = 1 = 100\%$

**$T_x$ (Quantidade de testes executados) = 5**

Cobertura de Testes (executados) = $\frac{T_x}{R_{ft}} = \frac{5}{5} = 1 = 100\%$

**$T_s$ (Quantidade de testes bem-sucedidos) = 4**

Cobertura de Testes (bem-sucedidos) = $\frac{T_s}{R_{ft}} = \frac{4}{5} = 0,8 = 80\%$

Falhas: TST005 (ver descrição no script).
