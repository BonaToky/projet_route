package com.projet.route.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;
import com.projet.route.service.SignalementService;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "*")
public class SignalementController {
    
    @Autowired
    private SignalementService signalementService;

    @Autowired
    private SignalementRepository signalementRepository;
    
    // Créer un nouveau signalement avec paramètres URL
    @PostMapping
    public ResponseEntity<Object> createSignalement(
            @RequestParam(required = false) String surfaceStr,  // Recevoir comme String
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude,
            @RequestParam(required = false) String idLieuxStr,  // Recevoir comme String
            @RequestParam String idUser,
            @RequestParam(required = false) String typeProbleme,
            @RequestParam(required = false) String description) {
        
        try {
            // Convertir seulement si non vide
            BigDecimal surface = null;
            if (surfaceStr != null && !surfaceStr.trim().isEmpty()) {
                surface = new BigDecimal(surfaceStr);
            }
            
            Integer idLieux = null;
            if (idLieuxStr != null && !idLieuxStr.trim().isEmpty()) {
                idLieux = Integer.parseInt(idLieuxStr);
            }
            
            Signalement signalement = signalementService.createSignalement(
                surface, latitude, longitude, idLieux, idUser, typeProbleme, description);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(signalement);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la création du signalement");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Créer un signalement avec JSON
    @PostMapping("/json")
    public ResponseEntity<Object> createSignalementJson(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-User-ID") String userId) {
        
        try {
            BigDecimal surface = request.get("surface") != null ? 
                new BigDecimal(request.get("surface").toString()) : null;
            BigDecimal latitude = new BigDecimal(request.get("latitude").toString());
            BigDecimal longitude = new BigDecimal(request.get("longitude").toString());
            Integer idLieux = request.get("idLieux") != null ? 
                Integer.parseInt(request.get("idLieux").toString()) : null;
            String typeProbleme = (String) request.get("typeProbleme");
            String description = (String) request.get("description");
            
            Signalement signalement = signalementService.createSignalement(
                surface, latitude, longitude, idLieux, userId, typeProbleme, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(signalement);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la création du signalement");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Récupérer tous les signalements
    @GetMapping
    public ResponseEntity<List<Signalement>> getAllSignalements() {
        List<Signalement> signalements = signalementService.getAllSignalements();
        return ResponseEntity.ok(signalements);
    }
    
    // Récupérer un signalement par ID
    // @GetMapping("/{id}")
    // public ResponseEntity<Object> getSignalementById(@PathVariable Long id) {
    //     Optional<Signalement> signalement = signalementService.getSignalementById(id);
        
    //     if (signalement.isPresent()) {
    //         return ResponseEntity.ok(signalement.get());
    //     } else {
    //         Map<String, String> error = new HashMap<>();
    //         error.put("error", "Signalement non trouvé");
    //         error.put("id", id.toString());
    //         return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    //     }
    // }
    
    // Récupérer les signalements d'un utilisateur
    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<Signalement>> getSignalementsByUser(@PathVariable String userId) {
        List<Signalement> signalements = signalementService.getSignalementsByUser(userId);
        return ResponseEntity.ok(signalements);
    }
    
    // Récupérer les signalements par statut
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Signalement>> getSignalementsByStatut(@PathVariable String statut) {
        List<Signalement> signalements = signalementService.getSignalementsByStatus(statut);
        return ResponseEntity.ok(signalements);
    }
    
    // Récupérer les signalements par type de problème
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Signalement>> getSignalementsByType(@PathVariable String type) {
        List<Signalement> signalements = signalementService.getSignalementsByType(type);
        return ResponseEntity.ok(signalements);
    }
    
    // Mettre à jour le statut d'un signalement
    @PutMapping("/{id}/statut")
    public ResponseEntity<Object> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        String newStatut = request.get("statut");
        if (newStatut == null || newStatut.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Le statut est requis");
            return ResponseEntity.badRequest().body(error);
        }
        
        Optional<Signalement> updated = signalementService.updateStatut(id, newStatut);
        
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Signalement non trouvé");
            error.put("id", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Mettre à jour un signalement complet
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateSignalement(
            @PathVariable Long id,
            @RequestBody Signalement signalementDetails) {
        
        Optional<Signalement> updated = signalementService.updateSignalement(id, signalementDetails);
        
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Signalement non trouvé");
            error.put("id", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Supprimer un signalement
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteSignalement(@PathVariable Long id) {
        boolean deleted = signalementService.deleteSignalement(id);
        
        if (deleted) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Signalement supprimé avec succès");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Signalement non trouvé");
            error.put("id", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Rechercher dans une zone géographique
    @GetMapping("/zone")
    public ResponseEntity<List<Signalement>> findInArea(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        
        List<Signalement> signalements = signalementService.findInArea(minLat, maxLat, minLon, maxLon);
        return ResponseEntity.ok(signalements);
    }
    
    // Obtenir les statistiques
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Long>> getStatistics() {
        Map<String, Long> statistics = signalementService.getStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    // Récupérer les signalements récents
    @GetMapping("/recents")
    public ResponseEntity<List<Signalement>> getRecentSignalements() {
        List<Signalement> signalements = signalementService.getRecentSignalements();
        return ResponseEntity.ok(signalements);
    }
    
    // Rechercher par mot-clé dans la description
    @GetMapping("/recherche")
    public ResponseEntity<List<Signalement>> searchByDescription(@RequestParam String keyword) {
        List<Signalement> signalements = signalementService.searchByDescription(keyword);
        return ResponseEntity.ok(signalements);
    }
    
    // Endpoint de test
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "API Signalements fonctionnelle");
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }
    
    // Endpoint de santé
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Signalements API");
        health.put("timestamp", System.currentTimeMillis());
        
        try {
            long count = signalementService.getAllSignalements().size();
            health.put("totalSignalements", count);
        } catch (Exception e) {
            health.put("database", "ERROR: " + e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debug() {
        Map<String, Object> debugInfo = new HashMap<>();
        
        try {
            debugInfo.put("service", "SignalementService présent");
            debugInfo.put("repository", signalementRepository != null ? "OK" : "NULL");
            
            // Test simple
            long count = signalementRepository.count();
            debugInfo.put("count", count);
            debugInfo.put("database", "Connecté - " + count + " enregistrement(s)");
            
            // Test avec une donnée simple
            Signalement test = new Signalement();
            test.setLatitude(new BigDecimal("-18.909845"));
            test.setLongitude(new BigDecimal("47.528123"));
            test.setIdUser("debug_user");
            test.setDateAjoute(LocalDateTime.now());
            
            Signalement saved = signalementRepository.save(test);
            debugInfo.put("testSave", "OK - ID: " + saved.getIdSignalement());
            
            // Supprimer le test
            signalementRepository.delete(saved);
            
        } catch (Exception e) {
            debugInfo.put("error", e.getMessage());
            debugInfo.put("errorClass", e.getClass().getName());
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(debugInfo);
    }
}