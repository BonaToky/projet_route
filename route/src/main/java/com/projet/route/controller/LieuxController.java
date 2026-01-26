package com.projet.route.controller;

import com.projet.route.models.Lieux;
import com.projet.route.service.LieuxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lieux")
@CrossOrigin(origins = "*")
public class LieuxController {
    
    @Autowired
    private LieuxService lieuxService;
    
    // Initialiser avec des données de test
    @PostMapping("/init")
    public ResponseEntity<Map<String, String>> initializeSampleData() {
        try {
            lieuxService.createSampleLieux();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Données d'exemple créées avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de l'initialisation");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Créer un nouveau lieu
    @PostMapping
    public ResponseEntity<Object> createLieux(@RequestBody Lieux lieux) {
        try {
            Lieux created = lieuxService.createLieux(lieux);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la création du lieu");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Récupérer tous les lieux
    @GetMapping
    public ResponseEntity<List<Lieux>> getAllLieux() {
        List<Lieux> lieux = lieuxService.getAllLieux();
        return ResponseEntity.ok(lieux);
    }
    
    // Récupérer un lieu par ID
    @GetMapping("/{id}")
    public ResponseEntity<Object> getLieuxById(@PathVariable Long id) {
        Optional<Lieux> lieux = lieuxService.getLieuxById(id);
        
        if (lieux.isPresent()) {
            return ResponseEntity.ok(lieux.get());
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lieu non trouvé");
            error.put("id", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Mettre à jour un lieu
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateLieux(@PathVariable Long id, @RequestBody Lieux lieuxDetails) {
        try {
            Optional<Lieux> updated = lieuxService.updateLieux(id, lieuxDetails);
            
            if (updated.isPresent()) {
                return ResponseEntity.ok(updated.get());
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Lieu non trouvé");
                error.put("id", id.toString());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la mise à jour");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Supprimer un lieu
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteLieux(@PathVariable Long id) {
        boolean deleted = lieuxService.deleteLieux(id);
        
        if (deleted) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Lieu supprimé avec succès");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lieu non trouvé");
            error.put("id", id.toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    // Rechercher des lieux par mot-clé
    @GetMapping("/recherche")
    public ResponseEntity<List<Lieux>> searchLieux(@RequestParam String keyword) {
        List<Lieux> lieux = lieuxService.searchLieux(keyword);
        return ResponseEntity.ok(lieux);
    }
    
    // Récupérer les lieux par ville
    @GetMapping("/ville/{ville}")
    public ResponseEntity<List<Lieux>> getLieuxByVille(@PathVariable String ville) {
        List<Lieux> lieux = lieuxService.getLieuxByVille(ville);
        return ResponseEntity.ok(lieux);
    }
    
    // Vérifier si un ID existe
    @GetMapping("/exists/{id}")
    public ResponseEntity<Map<String, Boolean>> checkExists(@PathVariable Long id) {
        boolean exists = lieuxService.existsById(id);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
    
    // Obtenir des statistiques
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        long total = lieuxService.getTotalCount();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLieux", total);
        stats.put("service", "Lieux API");
        stats.put("status", "active");
        
        return ResponseEntity.ok(stats);
    }
    
    // Endpoint de test
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "API Lieux fonctionnelle");
        response.put("status", "OK");
        response.put("version", "1.0");
        return ResponseEntity.ok(response);
    }
    
    // Obtenir la liste des IDs disponibles (pour le select dans React)
    @GetMapping("/ids")
    public ResponseEntity<List<Map<String, Object>>> getAvailableIds() {
        List<Lieux> allLieux = lieuxService.getAllLieux();
        
        List<Map<String, Object>> ids = allLieux.stream()
            .map(lieu -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", lieu.getIdLieux());
                map.put("libelle", lieu.getLibelle());
                map.put("ville", lieu.getVille());
                return map;
            })
            .toList();
        
        return ResponseEntity.ok(ids);
    }
}