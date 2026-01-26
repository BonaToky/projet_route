package com.projet.route.controller;

import com.projet.route.models.Utilisateur;
import com.projet.route.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "*")
public class UtilisateurController {
    
    @Autowired
    private UtilisateurService utilisateurService;
    
    // CREATE - Créer un nouvel utilisateur
    @PostMapping
    public ResponseEntity<?> createUtilisateur(@RequestBody Utilisateur utilisateur) {
        try {
            Utilisateur createdUtilisateur = utilisateurService.createUtilisateur(utilisateur);
            return new ResponseEntity<>(createdUtilisateur, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // READ - Récupérer tous les utilisateurs
    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUtilisateurs() {
        List<Utilisateur> utilisateurs = utilisateurService.getAllUtilisateurs();
        return ResponseEntity.ok(utilisateurs);
    }
    
    // READ - Récupérer un utilisateur par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUtilisateurById(@PathVariable Long id) {
        Optional<Utilisateur> utilisateur = utilisateurService.getUtilisateurById(id);
        if (utilisateur.isPresent()) {
            return ResponseEntity.ok(utilisateur.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilisateur non trouvé avec l'ID: " + id);
        }
    }
    
    // READ - Récupérer un utilisateur par nom d'utilisateur
    @GetMapping("/nom/{nomUtilisateur}")
    public ResponseEntity<?> getUtilisateurByNom(@PathVariable String nomUtilisateur) {
        Optional<Utilisateur> utilisateur = utilisateurService.getUtilisateurByNom(nomUtilisateur);
        if (utilisateur.isPresent()) {
            return ResponseEntity.ok(utilisateur.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilisateur non trouvé avec le nom: " + nomUtilisateur);
        }
    }
    
    // READ - Récupérer un utilisateur par email
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUtilisateurByEmail(@PathVariable String email) {
        Optional<Utilisateur> utilisateur = utilisateurService.getUtilisateurByEmail(email);
        if (utilisateur.isPresent()) {
            return ResponseEntity.ok(utilisateur.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilisateur non trouvé avec l'email: " + email);
        }
    }
    
    // UPDATE - Mettre à jour un utilisateur
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUtilisateur(@PathVariable Long id, @RequestBody Utilisateur utilisateurDetails) {
        try {
            Utilisateur updatedUtilisateur = utilisateurService.updateUtilisateur(id, utilisateurDetails);
            return ResponseEntity.ok(updatedUtilisateur);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // DELETE - Supprimer un utilisateur
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUtilisateur(@PathVariable Long id) {
        try {
            utilisateurService.deleteUtilisateur(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Utilisateur supprimé avec succès");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    // Rechercher des utilisateurs
    @GetMapping("/search")
    public ResponseEntity<List<Utilisateur>> searchUtilisateurs(@RequestParam String keyword) {
        List<Utilisateur> utilisateurs = utilisateurService.searchUtilisateurs(keyword);
        return ResponseEntity.ok(utilisateurs);
    }
    
    // Récupérer les utilisateurs bloqués
    @GetMapping("/bloques")
    public ResponseEntity<List<Utilisateur>> getUtilisateursBloques() {
        List<Utilisateur> utilisateurs = utilisateurService.getUtilisateursBloques();
        return ResponseEntity.ok(utilisateurs);
    }
    
    // Récupérer les utilisateurs non bloqués
    @GetMapping("/non-bloques")
    public ResponseEntity<List<Utilisateur>> getUtilisateursNonBloques() {
        List<Utilisateur> utilisateurs = utilisateurService.getUtilisateursNonBloques();
        return ResponseEntity.ok(utilisateurs);
    }
    
    // Récupérer les utilisateurs par rôle
    @GetMapping("/role/{idRole}")
    public ResponseEntity<List<Utilisateur>> getUtilisateursByRole(@PathVariable Integer idRole) {
        List<Utilisateur> utilisateurs = utilisateurService.getUtilisateursByRole(idRole);
        return ResponseEntity.ok(utilisateurs);
    }
    
    
    // Réinitialiser les tentatives d'échec
    @PutMapping("/{id}/reinitialiser-tentatives")
    public ResponseEntity<?> reinitialiserTentativesEchec(@PathVariable Long id) {
        try {
            utilisateurService.reinitialiserTentativesEchec(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Tentatives d'échec réinitialisées");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    // Vérifier si un nom d'utilisateur existe
    @GetMapping("/exists/nom/{nomUtilisateur}")
    public ResponseEntity<Map<String, Boolean>> existsByNomUtilisateur(@PathVariable String nomUtilisateur) {
        boolean exists = utilisateurService.existsByNomUtilisateur(nomUtilisateur);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
    
    // Vérifier si un email existe
    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Map<String, Boolean>> existsByEmail(@PathVariable String email) {
        boolean exists = utilisateurService.existsByEmail(email);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }
}