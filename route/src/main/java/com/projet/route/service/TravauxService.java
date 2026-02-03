package com.projet.route.service;

import com.projet.route.models.Travaux;
import com.projet.route.models.HistoriquesTravaux;
import com.projet.route.models.Signalement;
import com.projet.route.repository.TravauxRepository;
import com.projet.route.repository.HistoriquesTravauxRepository;
import com.projet.route.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class TravauxService {

    @Autowired
    private TravauxRepository travauxRepository;

    @Autowired
    private HistoriquesTravauxRepository historiquesTravauxRepository;

    @Autowired
    private SignalementRepository signalementRepository;

    @Transactional
    public void updateAvancementBasedOnStatut(Long signalementId, String statut) {
        // Trouver les travaux associés au signalement
        Signalement signalement = signalementRepository.findById(signalementId).orElse(null);
        if (signalement == null) {
            return;
        }

        // Déterminer l'avancement basé sur le statut
        BigDecimal avancement;
        String commentaire;
        switch (statut) {
            case "nouveau":
                avancement = BigDecimal.ZERO;
                commentaire = "Travaux non commencés";
                break;
            case "en cours":
                avancement = new BigDecimal("50.00");
                commentaire = "Travaux en cours";
                break;
            case "terminé":
                avancement = new BigDecimal("100.00");
                commentaire = "Travaux terminés";
                break;
            default:
                return;
        }

        // Trouver ou créer les travaux
        Travaux travaux = travauxRepository.findBySignalement(signalement).orElse(null);
        if (travaux != null) {
            // Mettre à jour l'avancement si différent
            if (travaux.getAvancement() == null || travaux.getAvancement().compareTo(avancement) != 0) {
                travaux.setAvancement(avancement);
                travauxRepository.save(travaux);

                // Créer un historique
                HistoriquesTravaux historique = new HistoriquesTravaux();
                historique.setTravaux(travaux);
                historique.setAvancement(avancement);
                historique.setCommentaire(commentaire);
                historique.setDateModification(LocalDateTime.now());
                historiquesTravauxRepository.save(historique);
            }
        }
    }
}
