package com.projet.route.services;

import com.projet.route.models.Lieu;
import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SignalementService {
    
    @Autowired
    private SignalementRepository signalementRepository;
    
    @Autowired
    private LieuService lieuService;
    
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }
    
    public Optional<Signalement> getSignalementById(Long id) {
        return signalementRepository.findById(id);
    }
    
    public Signalement createSignalement(Signalement signalement) {
        // Vérifier si le lieu existe
        if (signalement.getLieu() != null && signalement.getLieu().getIdLieux() != null) {
            Optional<Lieu> lieu = lieuService.getLieuById(signalement.getLieu().getIdLieux());
            if (lieu.isEmpty()) {
                throw new RuntimeException("Lieu non trouvé avec l'id: " + signalement.getLieu().getIdLieux());
            }
        }
        
        return signalementRepository.save(signalement);
    }
    
    public Signalement updateSignalement(Long id, Signalement signalementDetails) {
        Optional<Signalement> optionalSignalement = signalementRepository.findById(id);
        if (optionalSignalement.isPresent()) {
            Signalement signalement = optionalSignalement.get();
            signalement.setSurface(signalementDetails.getSurface());
            signalement.setLatitude(signalementDetails.getLatitude());
            signalement.setLongitude(signalementDetails.getLongitude());
            signalement.setLieu(signalementDetails.getLieu());
            signalement.setTypeProbleme(signalementDetails.getTypeProbleme());
            signalement.setStatut(signalementDetails.getStatut());
            signalement.setDescription(signalementDetails.getDescription());
            return signalementRepository.save(signalement);
        }
        throw new RuntimeException("Signalement non trouvé avec l'id: " + id);
    }
    
    public Signalement updateStatut(Long id, String statut) {
        Optional<Signalement> optionalSignalement = signalementRepository.findById(id);
        if (optionalSignalement.isPresent()) {
            Signalement signalement = optionalSignalement.get();
            signalement.setStatut(statut);
            return signalementRepository.save(signalement);
        }
        throw new RuntimeException("Signalement non trouvé avec l'id: " + id);
    }
    
    public void deleteSignalement(Long id) {
        signalementRepository.deleteById(id);
    }
    
    public List<Signalement> getSignalementsByUser(String userId) {
        return signalementRepository.findByIdUser(userId);
    }
    
    public List<Signalement> getSignalementsByStatut(String statut) {
        return signalementRepository.findByStatut(statut);
    }
    
    public List<Signalement> getSignalementsByDateRange(LocalDateTime start, LocalDateTime end) {
        return signalementRepository.findByDateAjouteBetween(start, end);
    }
}
