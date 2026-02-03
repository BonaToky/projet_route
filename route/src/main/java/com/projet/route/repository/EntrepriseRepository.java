package com.projet.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projet.route.models.Entreprise;

public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {
}