package com.projet.route.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "Lieux")
public class Lieux {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idLieux;

    @Column(nullable = false, length = 50)
    private String libelet;

    @Column(length = 50)
    private String ville;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Optionnel : liste des signalements liés à ce lieu
    @OneToMany(mappedBy = "idLieux", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RoutSignale> signalements;

    // === Constructeurs ===
    public Lieux() {}

    // === Getters et Setters ===
    public Integer getIdLieux() {
        return idLieux;
    }

    public void setIdLieux(Integer idLieux) {
        this.idLieux = idLieux;
    }

    public String getLibelet() {
        return libelet;
    }

    public void setLibelet(String libelet) {
        this.libelet = libelet;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<RoutSignale> getSignalements() {
        return signalements;
    }

    public void setSignalements(List<RoutSignale> signalements) {
        this.signalements = signalements;
    }
}
