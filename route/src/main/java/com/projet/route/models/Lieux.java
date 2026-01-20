package com.projet.route.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lieux")
public class Lieux {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLieux;

    @Column(nullable = false)
    private String libelle;

    private String ville;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Getters and setters
    public Long getIdLieux() { return idLieux; }
    public void setIdLieux(Long idLieux) { this.idLieux = idLieux; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}