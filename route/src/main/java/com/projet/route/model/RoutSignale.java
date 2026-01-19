package com.projet.route.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Rout_Signale")
public class RoutSignale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRoutSignale;

    @Column(nullable = false, precision = 15, scale = 6)
    private Double latitude;

    @Column(nullable = false, precision = 15, scale = 6)
    private Double longitude;

    @Column(nullable = false)
    private LocalDateTime dateAjoute = LocalDateTime.now();

    // Relation vers le lieu (optionnelle)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "Id_Lieux")
    private Lieux lieux;

    @Column(nullable = false)
    private String idUser; // ID Firebase de l'utilisateur

    @Column(length = 50)
    private String typeProbleme;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String etat = "non traité";

    // === Constructeurs ===
    public RoutSignale() {}

    // === Getters et Setters ===
    public Long getIdRoutSignale() {
        return idRoutSignale;
    }

    public void setIdRoutSignale(Long idRoutSignale) {
        this.idRoutSignale = idRoutSignale;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getDateAjoute() {
        return dateAjoute;
    }

    public void setDateAjoute(LocalDateTime dateAjoute) {
        this.dateAjoute = dateAjoute;
    }

    public Lieux getLieux() {
        return lieux;
    }

    public void setLieux(Lieux lieux) {
        this.lieux = lieux;
    }

    public String getIdUser() {
        return idUser;
    }

    public void setIdUser(String idUser) {
        this.idUser = idUser;
    }

    public String getTypeProbleme() {
        return typeProbleme;
    }

    public void setTypeProbleme(String typeProbleme) {
        this.typeProbleme = typeProbleme;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEtat() {
        return etat;
    }

    public void setEtat(String etat) {
        this.etat = etat;
    }
}
