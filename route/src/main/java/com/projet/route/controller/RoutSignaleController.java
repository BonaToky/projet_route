package com.projet.route.controller;

import com.projet.route.model.RoutSignale;
import com.projet.route.model.Lieux;
import com.projet.route.service.RoutSignaleService;
import com.projet.route.service.LieuxService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
public class RoutSignaleController {

    private final RoutSignaleService routSignaleService;
    private final LieuxService lieuxService;

    public RoutSignaleController(RoutSignaleService routSignaleService, LieuxService lieuxService) {
        this.routSignaleService = routSignaleService;
        this.lieuxService = lieuxService;
    }

    @GetMapping
    public List<RoutSignale> getAllSignalements() {
        return routSignaleService.getAllSignalements();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoutSignale> getSignalementById(@PathVariable Long id) {
        return routSignaleService.getSignalementById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RoutSignale> createSignalement(@RequestBody RoutSignale signalement) {
        // Vérifie si le lieu existe
        if(signalement.getLieux() != null && signalement.getLieux().getIdLieux() != null) {
            Lieux lieu = lieuxService.getLieuxById(signalement.getLieux().getIdLieux())
                    .orElseThrow(() -> new RuntimeException("Lieu non trouvé"));
            signalement.setLieux(lieu);
        }
        RoutSignale saved = routSignaleService.saveSignalement(signalement);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public RoutSignale updateSignalement(@PathVariable Long id, @RequestBody RoutSignale signalement) {
        return routSignaleService.getSignalementById(id).map(existing -> {
            existing.setLatitude(signalement.getLatitude());
            existing.setLongitude(signalement.getLongitude());
            existing.setTypeProbleme(signalement.getTypeProbleme());
            existing.setDescription(signalement.getDescription());
            existing.setEtat(signalement.getEtat());

            if(signalement.getLieux() != null && signalement.getLieux().getIdLieux() != null) {
                Lieux lieu = lieuxService.getLieuxById(signalement.getLieux().getIdLieux())
                        .orElseThrow(() -> new RuntimeException("Lieu non trouvé"));
                existing.setLieux(lieu);
            }

            return routSignaleService.saveSignalement(existing);
        }).orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        routSignaleService.deleteSignalement(id);
        return ResponseEntity.noContent().build();
    }

    // Récupérer les signalements d'un utilisateur Firebase
    @GetMapping("/user/{idUser}")
    public List<RoutSignale> getSignalementsByUser(@PathVariable String idUser) {
        return routSignaleService.getSignalementsByUser(idUser);
    }

    // Récupérer les signalements d'un lieu
    @GetMapping("/lieu/{idLieux}")
    public List<RoutSignale> getSignalementsByLieu(@PathVariable Integer idLieux) {
        Lieux lieu = lieuxService.getLieuxById(idLieux)
                .orElseThrow(() -> new RuntimeException("Lieu non trouvé"));
        return routSignaleService.getSignalementsByLieu(lieu);
    }
}

