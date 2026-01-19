package com.projet.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.projet.route.model.Lieux;

@Repository
public interface LieuxRepository extends JpaRepository<Lieux, Integer> {
    // Tu peux ajouter des méthodes personnalisées si nécessaire
}

