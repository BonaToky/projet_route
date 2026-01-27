package com.projet.route.repository;

import com.projet.route.models.Role;
import com.projet.route.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    
    Optional<Utilisateur> findByNomUtilisateur(String nomUtilisateur);
    
    Optional<Utilisateur> findByEmail(String email);
    
    boolean existsByNomUtilisateur(String nomUtilisateur);
    
    boolean existsByEmail(String email);
    
    List<Utilisateur> findByEstBloque(Boolean estBloque);
    
    List<Utilisateur> findByRole(Role role);
    
    List<Utilisateur> findBySourceAuth(String sourceAuth);
    
    @Query("SELECT u FROM Utilisateur u WHERE u.nomUtilisateur LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<Utilisateur> searchByKeyword(@Param("keyword") String keyword);
    
    @Transactional
    @Modifying
    @Query("UPDATE Utilisateur u SET u.tentativesEchec = :tentatives WHERE u.idUtilisateur = :id")
    void updateTentativesEchec(@Param("id") Long id, @Param("tentatives") Integer tentatives);
    
    @Transactional
    @Modifying
    @Query("UPDATE Utilisateur u SET u.estBloque = :estBloque WHERE u.idUtilisateur = :id")
    void updateBloqueStatus(@Param("id") Long id, @Param("estBloque") Boolean estBloque);
}