require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('Defina a variável JWT_SECRET (veja o arquivo .env.example).');
  process.exit(1);
}

const app = require('./app');
const db = require('./config/db');

// Aplica o esquema do banco na inicialização (comandos idempotentes: IF NOT EXISTS)
async function atualizarBanco() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('Banco de dados atualizado');
}

const PORT = process.env.PORT || 3000;
atualizarBanco()
  .catch((e) => console.error('Não foi possível atualizar o banco:', e.message))
  .finally(() => app.listen(PORT, () => console.log(`VoltMap rodando em http://localhost:${PORT}`)));
