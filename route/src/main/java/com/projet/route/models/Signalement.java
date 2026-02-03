package com.projet.route.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalement")
public class Signalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSignalement;

    private BigDecimal surface;

    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false)
    private LocalDateTime dateAjoute = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_lieux")
    private Lieux lieux;

    @Column(nullable = false)
    private String idUser;

    @Column(name = "type_probleme", columnDefinition = "VARCHAR(50)")
    private String typeProbleme;

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'non traité'")
    private String statut = "non traité";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "firestore_id", unique = true)
    private String firestoreId;

    // Getters and setters
    public Long getIdSignalement() { return idSignalement; }
    public void setIdSignalement(Long idSignalement) { this.idSignalement = idSignalement; }
    public BigDecimal getSurface() { return surface; }
    public void setSurface(BigDecimal surface) { this.surface = surface; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public LocalDateTime getDateAjoute() { return dateAjoute; }
    public void setDateAjoute(LocalDateTime dateAjoute) { this.dateAjoute = dateAjoute; }
    public Lieux getLieux() { return lieux; }
    public void setLieux(Lieux lieux) { this.lieux = lieux; }
    public String getIdUser() { return idUser; }
    public void setIdUser(String idUser) { this.idUser = idUser; }
    public String getTypeProbleme() { return typeProbleme; }
    public void setTypeProbleme(String typeProbleme) { this.typeProbleme = typeProbleme; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getFirestoreId() { return firestoreId; }
    public void setFirestoreId(String firestoreId) { this.firestoreId = firestoreId; }
}