package com.projet.route.repository;


import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.projet.route.models.Signalement;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    
    // Trouver les signalements par utilisateur
    List<Signalement> findByIdUser(String idUser);
    
    // Trouver les signalements par statut
    List<Signalement> findByStatut(String statut);
    
    // Trouver les signalements par type de problème
    List<Signalement> findByTypeProbleme(String typeProbleme);
    
    // Trouver les signalements par date
    List<Signalement> findByDateAjouteAfter(LocalDateTime date);
    
    // Trouver les signalements dans une zone géographique
    @Query("SELECT s FROM Signalement s WHERE s.latitude BETWEEN :minLat AND :maxLat AND s.longitude BETWEEN :minLon AND :maxLon")
    List<Signalement> findInArea(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon,
        @Param("maxLon") Double maxLon
    );
    
    // Trouver les signalements par lieu
    List<Signalement> findByIdLieux(Integer idLieux);
    
    // Compter les signalements par statut
    @Query("SELECT s.statut, COUNT(s) FROM Signalement s GROUP BY s.statut")
    List<Object[]> countByStatut();
    
    // Trouver les signalements récents (7 derniers jours)
    List<Signalement> findByDateAjouteBetween(LocalDateTime startDate, LocalDateTime endDate);
}