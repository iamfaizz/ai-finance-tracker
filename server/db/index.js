const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'db.rlqgojouqfcpkivgywgz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Faizkhan0112',
  ssl: { rejectUnauthorized: false },
  family: 4
});

module.exports = pool;