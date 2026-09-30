// Utilitários de teste. Testes de integração só rodam com TEST_DATABASE_URL definida
// (use um banco separado: as tabelas são apagadas e recriadas a cada execução).
const fs = require('fs');
const path = require('path');

const temBanco = Boolean(process.env.TEST_DATABASE_URL);
if (temBanco) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';

async function recriarBanco() {
  const db = require('../src/config/db');
  await db.query('DROP TABLE IF EXISTS forma_pagamento, favorito, check_in, ponto_de_recarga, usuario CASCADE');
  await db.query(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));
  return db;
}

module.exports = { temBanco, descreverComBanco: temBanco ? describe : describe.skip, recriarBanco };
