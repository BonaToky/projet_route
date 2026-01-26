package com.projet.route.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "signalement")
public class Signalement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_signalement")
    private Long idSignalement;
    
    @Column(name = "surface", precision = 10, scale = 2)
    private BigDecimal surface;
    
    @Column(name = "latitude", nullable = false, precision = 15, scale = 6)
    private BigDecimal latitude;
    
    @Column(name = "longitude", nullable = false, precision = 15, scale = 6)
    private BigDecimal longitude;
    
    @Column(name = "date_ajoute", nullable = false)
    private LocalDateTime dateAjoute;
    
    @Column(name = "id_lieux")
    private Integer idLieux;
    
    @Column(name = "id_user", nullable = false, length = 255)
    private String idUser;
    
    @Column(name = "type_probleme", length = 50)
    private String typeProbleme;
    
    @Column(name = "statut", length = 20)
    private String statut = "non traité";
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // Constructeurs
    public Signalement() {
        this.dateAjoute = LocalDateTime.now();
    }
    
    public Signalement(BigDecimal latitude, BigDecimal longitude, String idUser) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.idUser = idUser;
        this.dateAjoute = LocalDateTime.now();
        this.statut = "non traité";
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
    
    public Integer getIdLieux() {
        return idLieux;
    }
    
    public void setIdLieux(Integer idLieux) {
        this.idLieux = idLieux;
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