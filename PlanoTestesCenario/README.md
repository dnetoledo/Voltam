# Plano de Testes de Cenários – UC03 Cadastrar Novo Ponto de Recarga

VoltMap · versão v0.1 · Prática Profissional em ADS – Aula 4

Os scripts devem ser executados em sequência (TST001 a TST007), num banco de teste recém-criado com `npm run db:setup`. Cada script começa no estado em que o anterior deixou o banco.

| Script | Cenário | Dado-chave | Resultado esperado | Pontos no banco após |
| ------ | ------- | ---------- | ------------------ | -------------------- |
| [TST001](TST001.md) Cadastro bem-sucedido | Fluxo principal | Local a 51,2 m do ponto existente | Ponto gravado, sem alerta | 13 |
| [TST002](TST002.md) Cadastro bem-sucedido (2) | Fluxo principal | Nome com 3 caracteres e potência 1000 kW | Ponto gravado | 14 |
| [TST003](TST003.md) Duplicidade: revisar | Exceção A1 | Local a 48,9 m; "Revisar" | Alerta; nada gravado | 14 |
| [TST004](TST004.md) Duplicidade: cadastrar mesmo assim | Exceção A1 | Mesmo local; "Cadastrar mesmo assim" | Alerta; ponto gravado | 15 |
| [TST005](TST005.md) Nome curto demais | Exceção A2 | Nome com 2 caracteres | Mensagem de erro; nada gravado | 15 |
| [TST006](TST006.md) Potência acima do máximo | Exceção A2 | Potência 1000,1 kW | Mensagem de erro; nada gravado | 15 |
| [TST007](TST007.md) Sem tipo de conector | Exceção A2 | Nenhum conector | Mensagem de erro; nada gravado | 15 |

Consulta para conferir o banco após cada script:

```sql
SELECT nome, latitude, longitude, potencia_kw, status FROM ponto_de_recarga ORDER BY id;
```
