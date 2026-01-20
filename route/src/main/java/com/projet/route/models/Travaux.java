package com.projet.route.models;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "travaux")
public class Travaux {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "id_signalement", referencedColumnName = "id_signalement")
    private Signalement signalement;
    
    private BigDecimal budget;
    
    @Column(name = "date_debut_travaux")
    private LocalDate dateDebutTravaux;
    
    @Column(name = "date_fin_travaux")
    private LocalDate dateFinTravaux;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal avancement = BigDecimal.ZERO;
    
    // Constructeurs
    public Travaux() {}
    
    public Travaux(Signalement signalement) {
        this.signalement = signalement;
    }
    
    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Signalement getSignalement() {
        return signalement;
    }
    
    public void setSignalement(Signalement signalement) {
        this.signalement = signalement;
    }
    
    public BigDecimal getBudget() {
        return budget;
    }
    
    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }
    
    public LocalDate getDateDebutTravaux() {
        return dateDebutTravaux;
    }
    
    public void setDateDebutTravaux(LocalDate dateDebutTravaux) {
        this.dateDebutTravaux = dateDebutTravaux;
    }
    
    public LocalDate getDateFinTravaux() {
        return dateFinTravaux;
    }
    
    public void setDateFinTravaux(LocalDate dateFinTravaux) {
        this.dateFinTravaux = dateFinTravaux;
    }
    
    public BigDecimal getAvancement() {
        return avancement;
    }
    
    public void setAvancement(BigDecimal avancement) {
        this.avancement = avancement;
    }
}
