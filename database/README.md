# Base de Données Daretna

Pour le moment, l'application utilise une simulation locale (`localStorage`) située dans le dossier `frontend/services/db.ts`.

## Future Migration (SQL/NoSQL)

L'architecture est prête pour accueillir une vraie base de données.
Voici le schéma proposé pour la future implémentation (ex: PostgreSQL) :

### Table: Users
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | Sécurisé |
| points | INT | Gamification |

### Table: Groups
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Clé primaire |
| name | VARCHAR | Nom du groupe |
| amount | DECIMAL | Montant par personne |

### Table: Memberships
| Colonne | Type | Description |
|---------|------|-------------|
| user_id | UUID | FK -> Users |
| group_id | UUID | FK -> Groups |
| status | ENUM | PENDING, ACTIVE |
