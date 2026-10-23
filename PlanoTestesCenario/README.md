# Plano de Testes de Cenários – VoltMap v0.1

Prática Profissional em ADS · Aula 4 · Casos de uso UC01, UC02, UC03 e UC04

Os scripts devem ser executados em sequência (TST001 a TST020), num banco de teste recém-criado com `npm run db:setup`. Cada script começa no estado em que o anterior deixou o banco. O UC05 (Moderar Denúncias) não entra neste plano porque está previsto para a iteração 2.

| Script | Nome | Caso de uso | Cenário | Resultado esperado |
| ------ | ---- | ----------- | ------- | ------------------ |
| [TST001](TST001.md) | Login bem-sucedido | UC01 | Fluxo principal | Acesso liberado |
| [TST002](TST002.md) | Senha incorreta | UC01 | A1 | Mensagem de erro |
| [TST003](TST003.md) | E-mail não cadastrado | UC01 | A1 | Mensagem de erro |
| [TST004](TST004.md) | Conta bloqueada | UC01 | A2 | Mensagem de conta bloqueada |
| [TST005](TST005.md) | Busca pela localização atual | UC02 | Fluxo principal | 12 pontos em 10 km |
| [TST006](TST006.md) | Busca com raio de 5 km | UC02 | Fluxo principal | 8 pontos em 5 km |
| [TST007](TST007.md) | Busca com filtros de conector e potência | UC02 | Fluxo principal | 2 pontos |
| [TST008](TST008.md) | Nenhum ponto no raio | UC02 | A1 | Sugestão de aumentar o raio |
| [TST009](TST009.md) | Localização não autorizada | UC02 | A2 | Busca por endereço |
| [TST010](TST010.md) | Cadastro bem-sucedido | UC03 | Fluxo principal | Ponto gravado sem alerta |
| [TST011](TST011.md) | Cadastro bem-sucedido (2) | UC03 | Fluxo principal | Ponto gravado |
| [TST012](TST012.md) | Duplicidade: revisar | UC03 | A1 | Alerta; nada gravado |
| [TST013](TST013.md) | Duplicidade: cadastrar mesmo assim | UC03 | A1 | Alerta; ponto gravado |
| [TST014](TST014.md) | Nome curto demais | UC03 | A2 | Mensagem de erro |
| [TST015](TST015.md) | Potência acima do máximo | UC03 | A2 | Mensagem de erro |
| [TST016](TST016.md) | Sem tipo de conector | UC03 | A2 | Mensagem de erro |
| [TST017](TST017.md) | Check-in de ponto ocupado | UC04 | Fluxo principal | Status Ocupado |
| [TST018](TST018.md) | Ponto com defeito | UC04 | A1 | Status Fora de serviço |
| [TST019](TST019.md) | Status ainda válido (1 h 59 min) | UC04 | Fluxo principal | Continua Disponível |
| [TST020](TST020.md) | Status expirado (2 h 1 min) | UC04 | Fluxo principal | Volta a Não verificado |
