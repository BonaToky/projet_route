package com.projet.route.controller;

public class MobileLoginRequest {
    private String email;
    private String nomUtilisateur;
    private String sourceAuth;

    public MobileLoginRequest() {}

    public MobileLoginRequest(String email, String nomUtilisateur, String sourceAuth) {
        this.email = email;
        this.nomUtilisateur = nomUtilisateur;
        this.sourceAuth = sourceAuth;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNomUtilisateur() {
        return nomUtilisateur;
    }

    public void setNomUtilisateur(String nomUtilisateur) {
        this.nomUtilisateur = nomUtilisateur;
    }

    public String getSourceAuth() {
        return sourceAuth;
    }

    public void setSourceAuth(String sourceAuth) {
        this.sourceAuth = sourceAuth;
    }
}