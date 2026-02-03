package com.projet.route.controller;

import com.projet.route.models.Travaux;
import com.projet.route.models.HistoriquesTravaux;
import com.projet.route.repository.TravauxRepository;
import com.projet.route.repository.HistoriquesTravauxRepository;
import com.projet.route.service.FirebaseSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/travaux")
@CrossOrigin(origins = "*")
public class TravauxController {

    @Autowired
    private TravauxRepository travauxRepository;

    @Autowired
    private HistoriquesTravauxRepository historiquesTravauxRepository;

    @Autowired
    private FirebaseSyncService firebaseSyncService;

    @GetMapping
    public List<Travaux> getAllTravaux() {
        return travauxRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Travaux> getTravauxById(@PathVariable Long id) {
        Optional<Travaux> travaux = travauxRepository.findById(id);
        if (travaux.isPresent()) {
            return ResponseEntity.ok(travaux.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public Travaux createTravaux(@RequestBody Travaux travaux) {
        Travaux savedTravaux = travauxRepository.save(travaux);

        // Try to sync to Firestore
        try {
            firebaseSyncService.syncTravauxToFirestore(savedTravaux);
        } catch (Exception e) {
            // Log but don't fail the operation
            System.err.println("Failed to sync travaux to Firestore: " + e.getMessage());
        }

        return savedTravaux;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Travaux> updateTravaux(@PathVariable Long id, @RequestBody Travaux travauxDetails) {
        Optional<Travaux> optionalTravaux = travauxRepository.findById(id);
        if (optionalTravaux.isPresent()) {
            Travaux travaux = optionalTravaux.get();
            travaux.setEntreprise(travauxDetails.getEntreprise());
            travaux.setSignalement(travauxDetails.getSignalement());
            travaux.setBudget(travauxDetails.getBudget());
            travaux.setDateDebutTravaux(travauxDetails.getDateDebutTravaux());
            travaux.setDateFinTravaux(travauxDetails.getDateFinTravaux());
            travaux.setAvancement(travauxDetails.getAvancement());

            Travaux updatedTravaux = travauxRepository.save(travaux);

            // Try to sync to Firestore
            try {
                firebaseSyncService.syncTravauxToFirestore(updatedTravaux);
            } catch (Exception e) {
                // Log but don't fail the operation
                System.err.println("Failed to sync travaux to Firestore: " + e.getMessage());
            }

            return ResponseEntity.ok(updatedTravaux);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTravaux(@PathVariable Long id) {
        Optional<Travaux> travaux = travauxRepository.findById(id);
        if (travaux.isPresent()) {
            travauxRepository.delete(travaux.get());
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/historique")
    public HistoriquesTravaux addHistorique(@PathVariable Long id, @RequestBody HistoriquesTravaux historique) {
        Optional<Travaux> travaux = travauxRepository.findById(id);
        if (travaux.isPresent()) {
            historique.setTravaux(travaux.get());
            HistoriquesTravaux savedHistorique = historiquesTravauxRepository.save(historique);

            // Try to sync to Firestore
            try {
                firebaseSyncService.syncHistoriquesTravauxToFirestore(savedHistorique);
            } catch (Exception e) {
                // Log but don't fail the operation
                System.err.println("Failed to sync historique travaux to Firestore: " + e.getMessage());
            }

            return savedHistorique;
        }
        return null;
    }
}