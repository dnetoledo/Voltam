// Conexão com o PostgreSQL (usada somente pelos repositórios – Pure Fabrication)
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';
const local = /localhost|127\.0\.0\.1/.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
});

module.exports = pool;
