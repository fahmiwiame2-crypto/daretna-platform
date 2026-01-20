# Projet Daretna - Architecture Monorepo

Ce projet a été restructuré pour suivre une architecture professionnelle Full Stack.

## Structure du Projet

### 📂 frontend/
Contient l'application React (Vite).
- **Lancer l'app** :
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Base de données simulée** : `frontend/services/db.ts` (localStorage).

### 📂 backend/
Contient le serveur API (Node.js / Express).
- **Lancer le serveur** :
  ```bash
  cd backend
  npm install
  npm start
  ```
- *Note : Pour l'instant, le frontend utilise encore la DB locale. Le backend est prêt pour la future migration.*

### 📂 database/
Contient la documentation et les schémas de la base de données.

---
**Développé avec ❤️ pour Daretna.**
