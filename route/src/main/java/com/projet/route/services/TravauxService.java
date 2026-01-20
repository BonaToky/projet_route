package com.projet.route.services;


import com.projet.route.models.Signalement;
import com.projet.route.models.Travaux;
import com.projet.route.repository.TravauxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TravauxService {
    
    @Autowired
    private TravauxRepository travauxRepository;
    
    @Autowired
    private SignalementService signalementService;
    
    public List<Travaux> getAllTravaux() {
        return travauxRepository.findAll();
    }
    
    public Optional<Travaux> getTravauxById(Long id) {
        return travauxRepository.findById(id);
    }
    
    public Travaux createTravaux(Travaux travaux) {
        // Vérifier si le signalement existe
        if (travaux.getSignalement() != null && travaux.getSignalement().getIdSignalement() != null) {
            Optional<Signalement> signalement = signalementService.getSignalementById(
                travaux.getSignalement().getIdSignalement());
            
            if (signalement.isPresent()) {
                // Mettre à jour le statut du signalement
                signalement.get().setStatut("en cours");
                travaux.setSignalement(signalement.get());
            } else {
                throw new RuntimeException("Signalement non trouvé avec l'id: " + travaux.getSignalement().getIdSignalement());
            }
        }
        
        return travauxRepository.save(travaux);
    }
    
    public Travaux updateTravaux(Long id, Travaux travauxDetails) {
        Optional<Travaux> optionalTravaux = travauxRepository.findById(id);
        if (optionalTravaux.isPresent()) {
            Travaux travaux = optionalTravaux.get();
            travaux.setBudget(travauxDetails.getBudget());
            travaux.setDateDebutTravaux(travauxDetails.getDateDebutTravaux());
            travaux.setDateFinTravaux(travauxDetails.getDateFinTravaux());
            travaux.setAvancement(travauxDetails.getAvancement());
            
            // Si les travaux sont terminés (avancement = 100), mettre à jour le statut du signalement
            if (travaux.getAvancement().compareTo(new BigDecimal("100.00")) >= 0 && 
                travaux.getSignalement() != null) {
                travaux.getSignalement().setStatut("résolu");
            }
            
            return travauxRepository.save(travaux);
        }
        throw new RuntimeException("Travaux non trouvés avec l'id: " + id);
    }
    
    public void deleteTravaux(Long id) {
        travauxRepository.deleteById(id);
    }
    
    public Optional<Travaux> getTravauxBySignalementId(Long signalementId) {
        return travauxRepository.findBySignalementIdSignalement(signalementId);
    }
    
    public List<Travaux> getTravauxEnCours() {
        return travauxRepository.findByAvancementLessThan(new BigDecimal("100.00"));
    }
}
