# ⚡ VoltMap – Localizador de Pontos de Recarga para Veículos Elétricos

Projeto da disciplina **Prática Profissional em Análise e Desenvolvimento de Sistemas** (Universidade Presbiteriana Mackenzie).
Autora: Dayane Nascimento de Toledo · Professor: Tomaz Mikio Sasaki

**Versão 0.1 – Fase de Construção, Iteração 1 (C1)**

## Funcionalidades desta versão

| Caso de uso | Funcionalidade |
|---|---|
| RF01 | Criar conta de motorista (senha protegida com bcrypt) |
| UC01 | Autenticar-se (login com token JWT; credenciais inválidas e conta bloqueada) |
| UC02 | Buscar pontos de recarga próximos pela localização ou por endereço, com filtros de conector, potência, disponibilidade e raio; resultados ordenados por distância |
| RF05 | Ver detalhes de um ponto de recarga |
| UC03 | Cadastrar novo ponto de recarga (status "não verificado" e alerta de possível duplicidade) |
| UC04 | Fazer check-in (disponível, ocupado ou fora de serviço; o status vale por 2 horas) e **recarga ativa** (iniciar/encerrar) |
| RF09 | Favoritar pontos de recarga |
| – | **Pagamento da recarga** (cartão de crédito ou Pix) com resumo de energia e valor estimados — **modo demonstração, sem cobrança**; do cartão são guardados apenas bandeira e 4 últimos dígitos |
| – | **Meu Perfil**: dados, alterar senha, recarga ativa, favoritos, pontos cadastrados e check-ins |
| – | **Sobre o VoltMap**: versão publicada, commit e histórico de versões |

O VoltMap é uma **aplicação web instalável (PWA)**: funciona no navegador do computador e do celular e pode ser
instalado na tela de início do smartphone (iPhone: Safari → Compartilhar → *Adicionar à Tela de Início*;
Android: Chrome → *Instalar app*), abrindo em tela cheia como um aplicativo.

Ficam para a iteração C2: avaliações (RF08), denúncias e moderação (RF10, RF11, UC05), gestão de usuários (RF12) e fotos dos pontos.

## Tecnologias

- **Back-end:** Node.js 20+ e Express
- **Banco de dados:** PostgreSQL
- **Front-end:** HTML, CSS e JavaScript, com mapa Leaflet e dados do OpenStreetMap; PWA (manifest + service worker)
- **Hospedagem:** Render (aplicação) e Neon (banco de dados)

## Estrutura do projeto (relação com o Documento de Projeto)

```
src/
  controllers/     GRASP Controller  – Autenticacao, BuscaPontos, CadastroPonto, CheckIn, Favorito, Perfil, Pagamento
  repositories/    GRASP Pure Fabrication – RepositorioUsuario, RepositorioPontoDeRecarga, RepositorioCheckIn, RepositorioFavorito, RepositorioFormaPagamento
  models/          Entidades – Usuario, Motorista (Creator), PontoDeRecarga (Information Expert), CheckIn, FormaPagamento
  middlewares/     Controle de acesso por token JWT
  routes/          Rotas da API REST
public/            Telas (classes de fronteira)
  login.html       TelaLogin
  cadastro.html    TelaCadastroUsuario
  index.html       TelaMapa
  ponto.html       TelaDetalhesPonto
  novo-ponto.html  TelaNovoPontoRecarga
  perfil.html      TelaPerfil
  sobre.html       TelaSobre (versão publicada)
database/
  schema.sql       Criação das tabelas
  consultas.sql    Consultas diretas para comprovar a persistência dos dados
scripts/
  criar-banco.js   Cria as tabelas e insere dados de exemplo
tests/             Testes automatizados (Jest + Supertest)
docs/              Documentação do projeto
```

## API

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| POST | `/api/usuarios` | Criar conta | – |
| POST | `/api/auth/login` | Login | – |
| GET | `/api/pontos?lat=&lng=&raio=&conectores=&potenciaMin=&status=` | Buscar pontos próximos | – |
| GET | `/api/pontos/:id` | Detalhes do ponto | – |
| POST | `/api/pontos` | Cadastrar ponto | Token JWT |
| GET / POST | `/api/pontos/:id/checkins` | Listar / registrar check-in | POST: Token JWT |
| POST | `/api/recargas` · `/api/recargas/ativa/encerrar` | Iniciar / encerrar recarga | Token JWT |
| GET | `/api/recargas/ativa` | Recarga ativa do motorista | Token JWT |
| GET · PUT · DELETE | `/api/favoritos[/:pontoId]` | Favoritos | Token JWT |
| GET · PUT | `/api/perfil` · `/api/perfil/senha` | Meu perfil | Token JWT |
| GET · POST · PUT · DELETE | `/api/pagamentos/cartoes[/:id[/padrao]]` | Cartões (só bandeira e final) | Token JWT |
| GET | `/api/recargas` | Histórico de recargas | Token JWT |
| GET | `/api/versao` | Versão publicada | – |

## Como rodar no computador

Pré-requisitos: [Node.js 20+](https://nodejs.org) e um banco PostgreSQL (pode ser o do Neon).

```bash
npm install
cp .env.example .env        # depois edite o .env com a DATABASE_URL e o JWT_SECRET
npm run db:setup            # cria as tabelas e os dados de exemplo
npm start                   # abre em http://localhost:3000
```

Usuários de teste criados pelo `db:setup` (senha `voltmap123`): `motorista@voltmap.com` e `admin@voltmap.com`.

## Testes

```bash
npm test                                   # testes que não precisam de banco
TEST_DATABASE_URL=postgresql://... npm test   # todos os testes (use um banco SEPARADO: as tabelas são recriadas)
```

## Publicação (deploy)

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a *connection string*.
2. **Aplicação (Render):** em [render.com](https://render.com), crie um *Web Service* ligado a este repositório:
   - Build command: `npm install`
   - Start command: `npm start`
   - Variáveis de ambiente: `DATABASE_URL` (do Neon) e `JWT_SECRET` (um texto secreto longo)
3. As tabelas são criadas/atualizadas automaticamente quando o servidor inicia. Para inserir os dados de exemplo, rode `npm run db:setup` uma vez apontando para o banco do Neon (pelo seu computador, com a `DATABASE_URL` do Neon no `.env`).
4. A cada `git push` na branch `main`, o Render publica a nova versão automaticamente.

## Links

- Repositório: https://github.com/dnetoledo/Voltam
- Quadro Kanban: https://github.com/users/dnetoledo/projects/1
