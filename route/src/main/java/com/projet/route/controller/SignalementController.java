package com.projet.route.controller;

import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;
import com.projet.route.service.FirebaseSyncService;
import com.projet.route.service.TravauxService;
import com.projet.route.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "*")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private FirebaseSyncService firebaseSyncService;

    @Autowired
    private TravauxService travauxService;
    
    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    @GetMapping("/sync")
    public ResponseEntity<String> syncSignalements() {
        try {
            firebaseSyncService.syncSignalementsToLocal();
            return ResponseEntity.ok("Synchronisation terminée");
        } catch (Exception e) {
            System.err.println("Error in syncSignalements: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur lors de la synchronisation: " + e.getMessage());
        }
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Signalement> getSignalementById(@PathVariable Long id) {
        Optional<Signalement> signalement = signalementRepository.findById(id);
        if (signalement.isPresent()) {
            return ResponseEntity.ok(signalement.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<String> updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String statut = body.get("statut");
            if (statut == null || (!statut.equals("nouveau") && !statut.equals("en cours") && !statut.equals("terminé"))) {
                return ResponseEntity.badRequest().body("Statut invalide. Doit être 'nouveau', 'en cours' ou 'terminé'");
            }

            Optional<Signalement> signalementOpt = signalementRepository.findById(id);
            if (!signalementOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Signalement signalement = signalementOpt.get();
            String oldStatut = signalement.getStatut();
            signalement.setStatut(statut);
            signalementRepository.save(signalement);

            // Mettre à jour automatiquement l'avancement des travaux
            travauxService.updateAvancementBasedOnStatut(id, statut);
            
            // Envoyer une notification à l'utilisateur
            try {
                String userId = signalement.getIdUser();
                String firestoreId = signalement.getFirestoreId();
                if (userId != null && !userId.isEmpty() && firestoreId != null) {
                    notificationService.sendStatusUpdateNotification(userId, firestoreId, oldStatut, statut);
                }
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de la notification: " + e.getMessage());
                e.printStackTrace();
            }

            return ResponseEntity.ok("Statut mis à jour");
        } catch (Exception e) {
            System.err.println("Error updating statut: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
}