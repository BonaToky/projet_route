-- Table des lieux (ex: intersections, quartiers)
CREATE TABLE Lieux (
   Id_Lieux INT AUTO_INCREMENT PRIMARY KEY,
   libelet VARCHAR(50) NOT NULL,
   ville VARCHAR(50),
   description TEXT
);

-- Table des signalements de routes
CREATE TABLE Rout_Signale (
   Id_rout_signale INT AUTO_INCREMENT PRIMARY KEY,
   latitude DECIMAL(15,6) NOT NULL,
   longitude DECIMAL(15,6) NOT NULL,
   date_ajoute DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   Id_Lieux INT, -- référence vers un lieu connu (optionnel)
   Id_User VARCHAR(255) NOT NULL, -- identifiant de l'utilisateur Firebase
   type_probleme VARCHAR(50), -- ex: nid-de-poule, route inondée
   description TEXT, -- description de l'état ou du problème
   etat VARCHAR(20) DEFAULT 'non traité', -- suivi: 'non traité', 'en cours', 'résolu'
   FOREIGN KEY(Id_Lieux) REFERENCES Lieux(Id_Lieux)
);
