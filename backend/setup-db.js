const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true // Important pour exécuter le script SQL complet
  };

  let connection;

  try {
    console.log('🔄 Connexion à MySQL...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connecté à MySQL !');

    console.log('📂 Lecture du schéma SQL...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚙️ Exécution du script de création de base de données...');
    await connection.query(sql);
    
    console.log('✨ Base de données "daretna_db" et tables créées avec succès !');
    console.log('🚀 Vous pouvez maintenant lancer le serveur backend.');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données :', error);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
