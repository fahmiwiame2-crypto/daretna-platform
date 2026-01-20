const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Daretna (Backend)' });
});

// Test DB Connection
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({ 
      status: 'success', 
      message: 'Base de données connectée !', 
      test: rows[0].solution 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur de connexion à la base de données',
      error: err.message
    });
  }
});

// TEST ROUTE: Insert a dummy user to verify MySQL write access
app.post('/api/test-insert', async (req, res) => {
  try {
    const id = require('crypto').randomUUID();
    const email = `test-${Date.now()}@example.com`;
    
    // Insert into MySQL
    await db.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [id, email, 'hashed_password', 'Test User']
    );

    res.json({ status: 'success', message: 'Utilisateur de test inséré dans MySQL !', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Backend démarré sur le port ${PORT}`);
});
