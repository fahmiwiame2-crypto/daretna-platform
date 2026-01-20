-- Création de la base de données
CREATE DATABASE IF NOT EXISTS daretna_db;
USE daretna_db;

-- Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Mot de passe crypté
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('FREE', 'PREMIUM') DEFAULT 'FREE',
    points INT DEFAULT 0,
    level ENUM('Bronze', 'Argent', 'Or', 'Diamant') DEFAULT 'Bronze',
    avatar_url TEXT,
    verification_status ENUM('Unverified', 'Pending', 'Verified') DEFAULT 'Unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Groupes (Darets)
CREATE TABLE IF NOT EXISTS `groups` (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    name VARCHAR(100) NOT NULL,
    amount_per_person DECIMAL(10, 2) NOT NULL,
    periodicity ENUM('Mois', 'Semaine') DEFAULT 'Mois',
    start_date DATE,
    status ENUM('En attente', 'Actif', 'Terminé') DEFAULT 'En attente',
    admin_id VARCHAR(36),
    current_turn_index INT DEFAULT 0,
    draw_mode ENUM('RANDOM', 'MANUAL', 'WEIGHTED') DEFAULT 'RANDOM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des Membres (Lien Utilisateur <-> Groupe)
CREATE TABLE IF NOT EXISTS memberships (
    user_id VARCHAR(36),
    group_id VARCHAR(36),
    role ENUM('Responsable', 'Co-Responsable', 'Membre') DEFAULT 'Membre',
    tour_position INT,
    payment_status ENUM('PENDING', 'SUBMITTED', 'CONFIRMED', 'LATE') DEFAULT 'PENDING',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);

-- Table des Votes
CREATE TABLE IF NOT EXISTS votes (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36),
    creator_id VARCHAR(36),
    question TEXT NOT NULL,
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des Options de Vote
CREATE TABLE IF NOT EXISTS vote_options (
    id VARCHAR(36) PRIMARY KEY,
    vote_id VARCHAR(36),
    label VARCHAR(255) NOT NULL,
    count INT DEFAULT 0,
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
);
