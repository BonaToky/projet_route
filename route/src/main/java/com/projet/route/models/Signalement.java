package com.projet.route.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalement")
public class Signalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_signalement")
    private Long idSignalement;
    
    private BigDecimal surface;
    
    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal latitude;
    
    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal longitude;
    
    @CreationTimestamp
    @Column(name = "date_ajoute", nullable = false, updatable = false)
    private LocalDateTime dateAjoute;
    
    @ManyToOne
    @JoinColumn(name = "id_lieux")
    private Lieu lieu;
    
    @Column(name = "id_user", nullable = false)
    private String idUser;
    
    @Column(name = "type_probleme", length = 50)
    private String typeProbleme;
    
    @Column(length = 20)
    private String statut = "non traité";
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Constructeurs
    public Signalement() {}
    
    public Signalement(BigDecimal latitude, BigDecimal longitude, String idUser) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.idUser = idUser;
    }
    
    // Getters et Setters
    public Long getIdSignalement() {
        return idSignalement;
    }
    
    public void setIdSignalement(Long idSignalement) {
        this.idSignalement = idSignalement;
    }
    
    public BigDecimal getSurface() {
        return surface;
    }
    
    public void setSurface(BigDecimal surface) {
        this.surface = surface;
    }
    
    public BigDecimal getLatitude() {
        return latitude;
    }
    
    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }
    
    public BigDecimal getLongitude() {
        return longitude;
    }
    
    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
    
    public LocalDateTime getDateAjoute() {
        return dateAjoute;
    }
    
    public void setDateAjoute(LocalDateTime dateAjoute) {
        this.dateAjoute = dateAjoute;
    }
    
    public Lieu getLieu() {
        return lieu;
    }
    
    public void setLieu(Lieu lieu) {
        this.lieu = lieu;
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
    
    public String getStatut() {
        return statut;
    }
    
    public void setStatut(String statut) {
        this.statut = statut;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}
