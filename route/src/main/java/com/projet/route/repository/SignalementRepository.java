package com.projet.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projet.route.models.Signalement;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    Signalement findByFirestoreId(String firestoreId);
}