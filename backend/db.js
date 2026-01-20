const mysql = require('mysql2');
require('dotenv').config();

// Création de la connexion (Pool)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daretna_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Wrapper Promise pour utiliser async/await
const promisePool = pool.promise();

// Test de connexion initial
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('La connexion à la base de données a été fermée.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('La base de données a trop de connexions.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('La connexion à la base de données a été refusée.');
    }
  }
  if (connection) connection.release();
  return;
});

module.exports = promisePool;
