package com.projet.route.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUtilisateur;

    @ManyToOne
    @JoinColumn(name = "id_role")
    private Role role;

    @Column(unique = true, nullable = false)
    private String nomUtilisateur;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    private Boolean estBloque = false;
    private Integer tentativesEchec = 0;
    private LocalDateTime dateCreation = LocalDateTime.now();
    private LocalDateTime dateModification = LocalDateTime.now();
    private String sourceAuth = "local";

    // Getters and setters
    public Long getIdUtilisateur() { return idUtilisateur; }
    public void setIdUtilisateur(Long idUtilisateur) { this.idUtilisateur = idUtilisateur; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getNomUtilisateur() { return nomUtilisateur; }
    public void setNomUtilisateur(String nomUtilisateur) { this.nomUtilisateur = nomUtilisateur; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
    public Boolean getEstBloque() { return estBloque; }
    public void setEstBloque(Boolean estBloque) { this.estBloque = estBloque; }
    public Integer getTentativesEchec() { return tentativesEchec; }
    public void setTentativesEchec(Integer tentativesEchec) { this.tentativesEchec = tentativesEchec; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    public LocalDateTime getDateModification() { return dateModification; }
    public void setDateModification(LocalDateTime dateModification) { this.dateModification = dateModification; }
    public String getSourceAuth() { return sourceAuth; }
    public void setSourceAuth(String sourceAuth) { this.sourceAuth = sourceAuth; }
}



// package com.projet.route.models;

// import jakarta.persistence.*;
// import java.time.LocalDateTime;

// @Entity
// @Table(name = "utilisateurs")
// public class Utilisateur {
    
//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     @Column(name = "id_utilisateur")
//     private Long idUtilisateur;
    
//     @Column(name = "id_role")
//     private Integer idRole;
    
//     @Column(name = "nom_utilisateur", nullable = false, unique = true, length = 100)
//     private String nomUtilisateur;
    
//     @Column(name = "email", nullable = false, unique = true, length = 150)
//     private String email;
    
//     @Column(name = "mot_de_passe", nullable = false, length = 255)
//     private String motDePasse;
    
//     @Column(name = "est_bloque")
//     private Boolean estBloque = false;
    
//     @Column(name = "tentatives_echec")
//     private Integer tentativesEchec = 0;
    
//     @Column(name = "date_creation")
//     private LocalDateTime dateCreation;
    
//     @Column(name = "date_modification")
//     private LocalDateTime dateModification;
    
//     @Column(name = "source_auth", length = 50)
//     private String sourceAuth = "local";
    
//     // Constructeurs
//     public Utilisateur() {
//         this.dateCreation = LocalDateTime.now();
//         this.dateModification = LocalDateTime.now();
//     }
    
//     public Utilisateur(String nomUtilisateur, String email, String motDePasse) {
//         this.nomUtilisateur = nomUtilisateur;
//         this.email = email;
//         this.motDePasse = motDePasse;
//         this.dateCreation = LocalDateTime.now();
//         this.dateModification = LocalDateTime.now();
//     }
    
//     // Getters et Setters
//     public Long getIdUtilisateur() {
//         return idUtilisateur;
//     }
    
//     public void setIdUtilisateur(Long idUtilisateur) {
//         this.idUtilisateur = idUtilisateur;
//     }
    
//     public Integer getIdRole() {
//         return idRole;
//     }
    
//     public void setIdRole(Integer idRole) {
//         this.idRole = idRole;
//     }
    
//     public String getNomUtilisateur() {
//         return nomUtilisateur;
//     }
    
//     public void setNomUtilisateur(String nomUtilisateur) {
//         this.nomUtilisateur = nomUtilisateur;
//     }
    
//     public String getEmail() {
//         return email;
//     }
    
//     public void setEmail(String email) {
//         this.email = email;
//     }
    
//     public String getMotDePasse() {
//         return motDePasse;
//     }
    
//     public void setMotDePasse(String motDePasse) {
//         this.motDePasse = motDePasse;
//     }
    
//     public Boolean getEstBloque() {
//         return estBloque;
//     }
    
//     public void setEstBloque(Boolean estBloque) {
//         this.estBloque = estBloque;
//     }
    
//     public Integer getTentativesEchec() {
//         return tentativesEchec;
//     }
    
//     public void setTentativesEchec(Integer tentativesEchec) {
//         this.tentativesEchec = tentativesEchec;
//     }
    
//     public LocalDateTime getDateCreation() {
//         return dateCreation;
//     }
    
//     public void setDateCreation(LocalDateTime dateCreation) {
//         this.dateCreation = dateCreation;
//     }
    
//     public LocalDateTime getDateModification() {
//         return dateModification;
//     }
    
//     public void setDateModification(LocalDateTime dateModification) {
//         this.dateModification = dateModification;
//     }
    
//     public String getSourceAuth() {
//         return sourceAuth;
//     }
    
//     public void setSourceAuth(String sourceAuth) {
//         this.sourceAuth = sourceAuth;
//     }
    
//     // Méthodes utilitaires
//     @PreUpdate
//     public void preUpdate() {
//         this.dateModification = LocalDateTime.now();
//     }
    
//     public void incrementerTentativesEchec() {
//         this.tentativesEchec = (this.tentativesEchec == null) ? 1 : this.tentativesEchec + 1;
//     }
    
//     public void reinitialiserTentativesEchec() {
//         this.tentativesEchec = 0;
//     }
// }