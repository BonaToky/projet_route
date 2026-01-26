package com.projet.route.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;

@Service
@Transactional
public class SignalementService {
    
    @Autowired
    private SignalementRepository signalementRepository;
    
    // Créer un nouveau signalement
    public Signalement createSignalement(
            BigDecimal surface, 
            BigDecimal latitude, 
            BigDecimal longitude,
            Integer idLieux,
            String idUser,
            String typeProbleme,
            String description) {
        
        Signalement signalement = new Signalement();
        signalement.setSurface(surface);
        signalement.setLatitude(latitude);
        signalement.setLongitude(longitude);
        signalement.setIdLieux(idLieux);
        signalement.setIdUser(idUser);
        signalement.setTypeProbleme(typeProbleme);
        signalement.setDescription(description);
        signalement.setStatut("non traité");
        signalement.setDateAjoute(LocalDateTime.now());
        
        return signalementRepository.save(signalement);
    }
    
    // Récupérer tous les signalements
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }
    
    // Récupérer un signalement par ID
    public Optional<Signalement> getSignalementById(Long id) {
        return signalementRepository.findById(id);
    }
    
    // Récupérer les signalements d'un utilisateur
    public List<Signalement> getSignalementsByUser(String userId) {
        return signalementRepository.findByIdUser(userId);
    }
    
    // Récupérer les signalements par statut
    public List<Signalement> getSignalementsByStatus(String status) {
        return signalementRepository.findByStatut(status);
    }
    
    // Récupérer les signalements par type de problème
    public List<Signalement> getSignalementsByType(String type) {
        return signalementRepository.findByTypeProbleme(type);
    }
    
    // Mettre à jour le statut d'un signalement
    public Optional<Signalement> updateStatut(Long id, String newStatut) {
        Optional<Signalement> optionalSignalement = signalementRepository.findById(id);
        if (optionalSignalement.isPresent()) {
            Signalement signalement = optionalSignalement.get();
            signalement.setStatut(newStatut);
            return Optional.of(signalementRepository.save(signalement));
        }
        return Optional.empty();
    }
    
    // Mettre à jour un signalement complet
    public Optional<Signalement> updateSignalement(Long id, Signalement signalementDetails) {
        Optional<Signalement> optionalSignalement = signalementRepository.findById(id);
        if (optionalSignalement.isPresent()) {
            Signalement signalement = optionalSignalement.get();
            
            if (signalementDetails.getSurface() != null) {
                signalement.setSurface(signalementDetails.getSurface());
            }
            if (signalementDetails.getLatitude() != null) {
                signalement.setLatitude(signalementDetails.getLatitude());
            }
            if (signalementDetails.getLongitude() != null) {
                signalement.setLongitude(signalementDetails.getLongitude());
            }
            if (signalementDetails.getIdLieux() != null) {
                signalement.setIdLieux(signalementDetails.getIdLieux());
            }
            if (signalementDetails.getTypeProbleme() != null) {
                signalement.setTypeProbleme(signalementDetails.getTypeProbleme());
            }
            if (signalementDetails.getDescription() != null) {
                signalement.setDescription(signalementDetails.getDescription());
            }
            if (signalementDetails.getStatut() != null) {
                signalement.setStatut(signalementDetails.getStatut());
            }
            
            return Optional.of(signalementRepository.save(signalement));
        }
        return Optional.empty();
    }
    
    // Supprimer un signalement
    public boolean deleteSignalement(Long id) {
        if (signalementRepository.existsById(id)) {
            signalementRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    // Rechercher les signalements dans une zone géographique
    public List<Signalement> findInArea(Double minLat, Double maxLat, Double minLon, Double maxLon) {
        return signalementRepository.findInArea(minLat, maxLat, minLon, maxLon);
    }
    
    // Obtenir les statistiques
    public Map<String, Long> getStatistics() {
        List<Object[]> results = signalementRepository.countByStatut();
        Map<String, Long> stats = new HashMap<>();
        
        for (Object[] result : results) {
            String statut = (String) result[0];
            Long count = (Long) result[1];
            stats.put(statut, count);
        }
        
        // Ajouter le total
        long total = stats.values().stream().mapToLong(Long::longValue).sum();
        stats.put("total", total);
        
        return stats;
    }
    
    // Récupérer les signalements récents (7 derniers jours)
    public List<Signalement> getRecentSignalements() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);
        return signalementRepository.findByDateAjouteBetween(weekAgo, now);
    }
    
    // Rechercher par description (contient le texte)
    public List<Signalement> searchByDescription(String keyword) {
        // Note: Pour des recherches plus complexes, utiliser une requête @Query
        List<Signalement> allSignalements = signalementRepository.findAll();
        return allSignalements.stream()
                .filter(s -> s.getDescription() != null && 
                            s.getDescription().toLowerCase().contains(keyword.toLowerCase()))
                .toList();
    }
}