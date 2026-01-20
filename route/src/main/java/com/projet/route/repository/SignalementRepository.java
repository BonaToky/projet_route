package com.projet.route.repository;

import com.projet.route.models.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByIdUser(String idUser);
    List<Signalement> findByStatut(String statut);
    List<Signalement> findByTypeProbleme(String typeProbleme);
    List<Signalement> findByDateAjouteBetween(LocalDateTime start, LocalDateTime end);
    List<Signalement> findByLieuIdLieux(Long idLieu);
}
