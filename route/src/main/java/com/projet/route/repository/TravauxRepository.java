package com.projet.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projet.route.models.Travaux;

public interface TravauxRepository extends JpaRepository<Travaux, Long> {
    Travaux findByFirestoreId(String firestoreId);
}