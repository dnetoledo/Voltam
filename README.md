# ⚡ VoltMap – Localizador de Pontos de Recarga para Veículos Elétricos

Projeto da disciplina **Prática Profissional em Análise e Desenvolvimento de Sistemas** (Universidade Presbiteriana Mackenzie).
Grupo 31: Dayane Nascimento de Toledo, Nicoly Santos Silva, Samuel Rojas Romero e Gustavo De Oliveira Nunes · Professor: Tomaz Mikio Sasaki

**Versão 0.2 – Fase de Construção, Iteração 2 (C2)** · tag [`v2`](https://github.com/dnetoledo/Voltam/tree/v2)

| Versão | Iteração | Tag no repositório |
|---|---|---|
| 0.1 | Construção – Iteração 1 (C1) | [`v1`](https://github.com/dnetoledo/Voltam/tree/v1) (também `v0.1`) |
| 0.2 | Construção – Iteração 2 (C2) | [`v2`](https://github.com/dnetoledo/Voltam/tree/v2) |

---

## Sumário

1. [Como executar no seu computador (passo a passo)](#1-como-executar-no-seu-computador-passo-a-passo)
2. [Usuários de teste e roteiro rápido](#2-usuários-de-teste-e-roteiro-rápido)
3. [Testes automatizados](#3-testes-automatizados)
4. [Problemas comuns](#4-problemas-comuns)
5. [Funcionalidades](#5-funcionalidades)
6. [Tecnologias e estrutura do projeto](#6-tecnologias-e-estrutura-do-projeto)
7. [API](#7-api)
8. [Publicação (deploy)](#8-publicação-deploy)

---

## 1. Como executar no seu computador (passo a passo)

São 6 passos: instalar o Node.js, ter um banco PostgreSQL, baixar o código, configurar o `.env`, criar as tabelas e iniciar.

### Passo 1 – Instalar o Node.js (versão 20 ou mais nova)

- Baixe a versão **LTS** em <https://nodejs.org> e instale (Windows, macOS ou Linux).
- Confira no terminal (no Windows, use o *Prompt de Comando* ou o *PowerShell*):

```bash
node -v    # deve mostrar v20.x.x ou maior
npm -v
```

### Passo 2 – Ter um banco de dados PostgreSQL

Escolha **uma** das três opções. Anote a **URL de conexão** (ela vai no Passo 4).

**Opção A – Neon (na nuvem, sem instalar nada) – mais simples**

1. Crie uma conta gratuita em <https://neon.tech> e crie um projeto.
2. No *Dashboard*, clique em **Connection string** e copie a URL. Ela tem este formato:
   `postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require`

**Opção B – PostgreSQL instalado no computador**

1. Instale o PostgreSQL 14 ou mais novo:
   - Windows/macOS: instalador em <https://www.postgresql.org/download/> (anote a senha do usuário `postgres` definida na instalação);
   - macOS com Homebrew: `brew install postgresql@16 && brew services start postgresql@16`;
   - Ubuntu/Debian: `sudo apt install postgresql`.
2. Crie o banco `voltmap`:

```bash
psql -U postgres -c "CREATE DATABASE voltmap;"
```

3. A URL fica: `postgresql://postgres:SUA_SENHA@localhost:5432/voltmap`

**Opção C – Docker**

```bash
docker run --name voltmap-db -e POSTGRES_PASSWORD=voltmap -e POSTGRES_DB=voltmap -p 5432:5432 -d postgres:16
```

A URL fica: `postgresql://postgres:voltmap@localhost:5432/voltmap`

### Passo 3 – Baixar o código e instalar as dependências

```bash
git clone https://github.com/dnetoledo/Voltam.git
cd Voltam
git checkout v2          # opcional: usa exatamente a versão entregue na Iteração 2
npm install
```

> Sem Git? Em <https://github.com/dnetoledo/Voltam/tree/v2> clique em **Code → Download ZIP**, descompacte e abra o terminal dentro da pasta.

### Passo 4 – Configurar as variáveis de ambiente (`.env`)

Copie o modelo:

```bash
cp .env.example .env       # Windows (Prompt de Comando): copy .env.example .env
```

Abra o arquivo `.env` em um editor de texto e preencha:

```ini
PORT=3000
DATABASE_URL=postgresql://postgres:voltmap@localhost:5432/voltmap
JWT_SECRET=qualquer-texto-secreto-e-longo-por-exemplo-voltmap-2026
```

- `DATABASE_URL`: a URL anotada no Passo 2. Para `localhost` a conexão é feita sem SSL; para o Neon, com SSL (automático).
- `JWT_SECRET`: um texto qualquer, longo, usado para assinar os tokens de login. **Obrigatório**: sem ele o servidor não inicia.

### Passo 5 – Criar as tabelas e os dados de exemplo

```bash
npm run db:setup
```

Saída esperada:

```
✔ Tabelas criadas
✔ 12 pontos de recarga de exemplo inseridos
✔ 6 avaliações e 4 denúncias de exemplo inseridas (iteração 2)
✔ Usuários de teste: motorista@voltmap.com / admin@voltmap.com (senha: voltmap123)
```

O comando pode ser executado mais de uma vez: ele não duplica os dados.

### Passo 6 – Iniciar a aplicação

```bash
npm start
```

Saída esperada:

```
Banco de dados atualizado
VoltMap rodando em http://localhost:3000
```

Abra **<http://localhost:3000>** no navegador. Para parar o servidor, pressione `Ctrl + C` no terminal.

> Durante o desenvolvimento, `npm run dev` reinicia o servidor automaticamente a cada alteração no código.

---

## 2. Usuários de teste e roteiro rápido

Todos com a senha **`voltmap123`**:

| E-mail | Tipo | Para que serve |
|---|---|---|
| `motorista@voltmap.com` | Motorista | Cadastrou os 12 pontos de exemplo |
| `joao@voltmap.com` | Motorista | Autor de uma avaliação ofensiva já denunciada |
| `maria@voltmap.com` | Motorista | Autora de avaliações e denúncias de exemplo |
| `admin@voltmap.com` | Administrador | Painel administrativo: denúncias e usuários |

Roteiro de 5 minutos para conferir a Iteração 2:

1. Entre como `maria@voltmap.com`. No mapa, clique em **Usar minha localização** ou busque "Av. Paulista, São Paulo". Os pontos mostram a **nota média ★**.
2. Abra **Eletroposto Paulista Center**: veja **Avaliações**, publique uma nota, use **📷 Adicionar foto** e **⚑ Denunciar** em uma avaliação ou foto.
3. Saia e entre como `admin@voltmap.com`: o **Painel administrativo** abre com as denúncias pendentes (UC05). Escolha uma e decida entre **Arquivar denúncia**, **Suspender ponto** ou **Remover conteúdo**.
4. Remova a avaliação do João. Depois entre como `joao@voltmap.com` e abra **Meu perfil**: a **notificação** de remoção aparece no topo.
5. No painel, em **Usuários**, bloqueie e desbloqueie um motorista (RF12). Com a conta bloqueada, o login mostra a mensagem de conta bloqueada (UC01 – A2).

---

## 3. Testes automatizados

Testes de unidade (classes de domínio) e de integração (API + banco), com **Jest** e **Supertest**.

```bash
npm test
```

Sem a variável `TEST_DATABASE_URL`, rodam apenas os testes que não precisam de banco (os demais aparecem como *skipped*).
Para rodar **todos**, crie um banco **separado** – as tabelas dele são apagadas e recriadas a cada execução:

```bash
psql -U postgres -c "CREATE DATABASE voltmap_teste;"

# macOS / Linux
TEST_DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/voltmap_teste npm test

# Windows (PowerShell)
$env:TEST_DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/voltmap_teste"; npm test
```

Resultado esperado: `Tests: 57 passed, 57 total`.

O plano de testes de cenário (scripts manuais TST001 a TST020) está em [`PlanoTestesCenario/`](PlanoTestesCenario/).

---

## 4. Problemas comuns

| Mensagem / sintoma | Causa e solução |
|---|---|
| `Defina a variável JWT_SECRET` | O arquivo `.env` não existe ou está sem `JWT_SECRET`. Refaça o Passo 4. |
| `Não foi possível atualizar o banco: ... ECONNREFUSED` | O PostgreSQL não está rodando ou a `DATABASE_URL` está errada. Confira o Passo 2 (no Docker: `docker start voltmap-db`). |
| `password authentication failed for user "postgres"` | Senha incorreta na `DATABASE_URL`. |
| `database "voltmap" does not exist` | Crie o banco: `psql -U postgres -c "CREATE DATABASE voltmap;"`. |
| `EADDRINUSE: address already in use :::3000` | A porta 3000 está ocupada. Mude `PORT=3001` no `.env` e acesse <http://localhost:3001>. |
| O mapa aparece cinza | O mapa e a busca de endereços usam o OpenStreetMap: é preciso estar conectado à internet. |
| "Usar minha localização" não funciona | O navegador só libera a localização em `localhost` ou HTTPS; permita o acesso quando o navegador perguntar, ou busque por endereço. |
| Tela antiga depois de atualizar o código | O app é instalável (PWA) e guarda cópias das telas. Recarregue com `Ctrl + Shift + R` (`Cmd + Shift + R` no Mac). |
| `npm: command not found` | Node.js não instalado ou terminal aberto antes da instalação. Refaça o Passo 1 e abra um terminal novo. |

---

## 5. Funcionalidades

### Iteração 2 (versão 0.2 – tag `v2`)

| Requisito / caso de uso | Funcionalidade |
|---|---|
| **RF08** | Avaliar ponto de recarga com nota de 1 a 5 estrelas e comentário; nota média no ponto e no mapa; uma avaliação por motorista em cada ponto (pode ser atualizada) |
| **RF05** (ampliação) | **Fotos do local**: enviar fotos do ponto (também no cadastro de um ponto novo); a foto é reduzida no aparelho antes do envio |
| **RF10** | Denunciar ponto inexistente, informação incorreta, avaliação ofensiva ou foto imprópria |
| **RF11 / UC05** | **Moderar denúncias** no painel administrativo: arquivar sem ação, **suspender ponto** (A2) ou **remover conteúdo** (A1); denúncias repetidas sobre o mesmo conteúdo são resolvidas juntas; pontos suspensos podem ser reativados |
| Enviar Notificação | O autor do conteúdo removido recebe uma notificação em Meu perfil |
| **RF12** | **Gerenciar usuários**: listar, buscar, bloquear e desbloquear; o bloqueio vale imediatamente, inclusive para quem já estava logado |

### Iteração 1 (versão 0.1 – tag `v1`)

| Requisito / caso de uso | Funcionalidade |
|---|---|
| RF01 / UC01 | Criar conta; autenticar-se com token JWT (credenciais inválidas e conta bloqueada) |
| UC02 / RF03 / RF04 | Buscar pontos próximos pela localização ou por endereço, com filtros de conector, potência, disponibilidade e raio |
| RF05 | Ver detalhes do ponto de recarga |
| UC03 / RF06 | Cadastrar ponto ("não verificado") com alerta de possível duplicidade |
| UC04 / RF07 | Check-in (disponível, ocupado ou fora de serviço; vale por 2 horas) e recarga ativa |
| RF09 | Favoritos |
| – | Pagamento da recarga por cartão ou Pix (**modo demonstração, sem cobrança**), Meu perfil, Sobre e Guia do Usuário |

O VoltMap é uma **aplicação web instalável (PWA)**: funciona no navegador do computador e do celular e pode ser instalado
na tela de início do smartphone (iPhone: Safari → Compartilhar → *Adicionar à Tela de Início*; Android: Chrome → *Instalar app*).

---

## 6. Tecnologias e estrutura do projeto

- **Back-end:** Node.js 20+ e Express 5
- **Banco de dados:** PostgreSQL (driver `pg`)
- **Segurança:** senhas com hash bcrypt; acesso controlado por token JWT
- **Front-end:** HTML, CSS e JavaScript, mapa Leaflet com dados do OpenStreetMap; PWA (manifest + service worker)
- **Testes:** Jest e Supertest
- **Hospedagem:** Render (aplicação) e Neon (banco de dados)

Estrutura de pastas e relação com o Documento de Projeto (camadas fronteira / controle / entidade e padrões GRASP):

```
src/
  controllers/     GRASP Controller – um por caso de uso:
                   Autenticacao, BuscaPontos, CadastroPonto, CheckIn, Favorito, Perfil, Pagamento,
                   Avaliacao, Foto, Denuncia, Moderacao (UC05), GestaoUsuarios (RF12), Notificacao
  repositories/    GRASP Pure Fabrication – acesso ao banco:
                   RepositorioUsuario, RepositorioPontoDeRecarga, RepositorioCheckIn, RepositorioFavorito,
                   RepositorioFormaPagamento, RepositorioAvaliacao, RepositorioFotoPonto,
                   RepositorioDenuncia, RepositorioNotificacao
  models/          Entidades (Modelo de Domínio):
                   Usuario → Motorista (Creator) / Administrador
                   ConteudoModeravel (abstrata) → PontoDeRecarga (Information Expert) / Avaliacao / FotoPonto
                     – remover() é polimórfico: ponto é suspenso, avaliação e foto são apagadas
                   CheckIn, Denuncia, Notificacao, FormaPagamento
  middlewares/     Autenticação JWT, conta bloqueada e acesso de administrador
  routes/          Rotas da API REST
public/            Telas (classes de fronteira)
  login.html · cadastro.html · index.html (mapa) · ponto.html · novo-ponto.html
  perfil.html · admin.html (painel administrativo) · sobre.html · ajuda.html (Guia do Usuário)
database/
  schema.sql       Criação das tabelas (aplicado também automaticamente quando o servidor inicia)
  consultas.sql    Consultas para conferir a persistência dos dados
scripts/
  criar-banco.js   npm run db:setup – tabelas + dados de exemplo
tests/             Testes automatizados (Jest + Supertest)
PlanoTestesCenario/ Plano de testes de cenário (TST001–TST020)
docs/              Guia do Usuário e diagrama de implantação
```

---

## 7. API

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/api/usuarios` | Criar conta | público |
| POST | `/api/auth/login` | Login | público |
| GET | `/api/pontos?lat=&lng=&raio=&conectores=&potenciaMin=&status=` | Buscar pontos próximos (com nota média) | público |
| GET | `/api/pontos/:id` | Detalhes do ponto | público |
| POST | `/api/pontos` | Cadastrar ponto | motorista |
| GET · POST | `/api/pontos/:id/checkins` | Listar / registrar check-in | POST: motorista |
| POST | `/api/recargas` · `/api/recargas/ativa/encerrar` | Iniciar / encerrar recarga | motorista |
| GET | `/api/recargas` · `/api/recargas/ativa` | Histórico / recarga ativa | motorista |
| GET · PUT · DELETE | `/api/favoritos[/:pontoId]` | Favoritos | motorista |
| GET · POST · PUT · DELETE | `/api/pagamentos/cartoes[/:id[/padrao]]` | Cartões (só bandeira e final) | motorista |
| GET · PUT | `/api/perfil` · `/api/perfil/senha` | Meu perfil | logado |
| GET · POST | `/api/pontos/:id/avaliacoes` | Listar / publicar avaliação (RF08) | POST: motorista |
| GET | `/api/pontos/:id/avaliacoes/minha` | Avaliação do motorista logado | motorista |
| GET · POST | `/api/pontos/:id/fotos` | Listar / enviar foto (JSON com imagem em base64) | POST: motorista |
| GET | `/api/fotos/:id` | Imagem da foto | público |
| POST | `/api/denuncias` | Registrar denúncia (RF10) | motorista |
| GET · POST | `/api/notificacoes` · `/api/notificacoes/lidas` | Notificações / marcar como lidas | logado |
| GET | `/api/moderacao/denuncias[/:id]` | Denúncias pendentes / detalhes (UC05) | administrador |
| POST | `/api/moderacao/denuncias/:id/decisao` | `{ acao: REMOVER_CONTEUDO \| SUSPENDER_PONTO \| ARQUIVAR }` | administrador |
| GET | `/api/moderacao/historico` · `/api/moderacao/pontos-suspensos` | Histórico / pontos suspensos | administrador |
| POST | `/api/moderacao/pontos/:id/reativar` | Reativar ponto suspenso | administrador |
| GET · PUT | `/api/admin/usuarios?busca=` · `/api/admin/usuarios/:id/bloqueio` | Listar / bloquear usuários (RF12) | administrador |
| GET | `/api/versao` · `/api/health` | Versão publicada / saúde do servidor | público |

---

## 8. Publicação (deploy)

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a *connection string*.
2. **Aplicação (Render):** em [render.com](https://render.com), crie um *Web Service* ligado a este repositório:
   - Build command: `npm install`
   - Start command: `npm start`
   - Variáveis de ambiente: `DATABASE_URL` (do Neon) e `JWT_SECRET` (um texto secreto longo)
3. As tabelas são criadas/atualizadas automaticamente quando o servidor inicia. Para inserir os dados de exemplo,
   rode `npm run db:setup` uma vez no seu computador, com a `DATABASE_URL` do Neon no `.env`.
4. A cada `git push` na branch `main`, o Render publica a nova versão automaticamente.

## Links

- Repositório: <https://github.com/dnetoledo/Voltam>
- Quadro Kanban: <https://github.com/users/dnetoledo/projects/1>
