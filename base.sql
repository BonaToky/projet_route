\c postgres;
DROP DATABASE IF EXISTS route;
CREATE DATABASE route;
\c route

CREATE TABLE roles (
   id SERIAL PRIMARY KEY,
   nom VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE utilisateurs (
   id_utilisateur SERIAL PRIMARY KEY,
   id_role INT,
   nom_utilisateur VARCHAR(100) UNIQUE NOT NULL,
   email VARCHAR(150) UNIQUE NOT NULL,
   mot_de_passe_hash TEXT NOT NULL,
   est_bloque BOOLEAN DEFAULT FALSE,
   tentatives_echec INT DEFAULT 0,
   date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_role) REFERENCES roles(id)
);

-- Table des lieux (ex: intersections, quartiers)
CREATE TABLE Lieux (
   Id_Lieux SERIAL PRIMARY KEY,
   libelle VARCHAR(50) NOT NULL,
   ville VARCHAR(50),
   description TEXT
);

CREATE TABLE entreprise (
   id SERIAL PRIMARY KEY,
   nom VARCHAR(100)
);

-- Table des signalements de routes
CREATE TABLE signalement (
   Id_signalement SERIAL PRIMARY KEY,
   surface DECIMAL(10,2),
   latitude DECIMAL(15,6) NOT NULL,
   longitude DECIMAL(15,6) NOT NULL,
   date_ajoute TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   Id_Lieux INT, -- référence vers un lieu connu (optionnel)
   Id_User VARCHAR(255) NOT NULL, -- identifiant de l'utilisateur Firebase
   type_probleme VARCHAR(50), -- ex: nid-de-poule, route inondée
   statut VARCHAR(20) DEFAULT 'non traité', -- suivi: 'non traité', 'en cours', 'résolu'
   description TEXT, -- description de l'état ou du problème
   FOREIGN KEY(Id_Lieux) REFERENCES Lieux(Id_Lieux)
);

CREATE TABLE travaux (
   id SERIAL PRIMARY KEY,
   id_signalement INT,
   budget DECIMAL(20,2),
   date_debut_travaux DATE,
   date_fin_travaux DATE,
   avancement DECIMAL(5,2) DEFAULT 0.00 -- pourcentage d'avancement
);
