package com.projet.route.repository;

import com.projet.route.models.Lieux;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LieuxRepository extends JpaRepository<Lieux, Long> {
    
    // Trouver par libellé (exact match)
    Optional<Lieux> findByLibelle(String libelle);
    
    // Trouver par ville
    List<Lieux> findByVille(String ville);
    
    // Rechercher par mot-clé dans libellé ou description
    @Query("SELECT l FROM Lieux l WHERE " +
           "LOWER(l.libelle) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.ville) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Lieux> searchByKeyword(@Param("keyword") String keyword);
    
    // Vérifier si un libellé existe déjà (pour éviter les doublons)
    boolean existsByLibelle(String libelle);
    
    // Trouver les lieux avec description non vide
    List<Lieux> findByDescriptionIsNotNull();
    
    // Compter par ville
    Long countByVille(String ville);
}