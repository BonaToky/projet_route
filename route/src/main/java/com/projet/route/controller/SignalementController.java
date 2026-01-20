package com.projet.route.controller;

import com.projet.route.models.Signalement;
import com.projet.route.services.SignalementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/signalements")
public class SignalementController {
    
    @Autowired
    private SignalementService signalementService;
    
    @GetMapping
    public ResponseEntity<List<Signalement>> getAllSignalements() {
        List<Signalement> signalements = signalementService.getAllSignalements();
        return new ResponseEntity<>(signalements, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Signalement> getSignalementById(@PathVariable Long id) {
        return signalementService.getSignalementById(id)
                .map(signalement -> new ResponseEntity<>(signalement, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<Signalement> createSignalement(@RequestBody Signalement signalement) {
        Signalement createdSignalement = signalementService.createSignalement(signalement);
        return new ResponseEntity<>(createdSignalement, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Signalement> updateSignalement(@PathVariable Long id, @RequestBody Signalement signalement) {
        try {
            Signalement updatedSignalement = signalementService.updateSignalement(id, signalement);
            return new ResponseEntity<>(updatedSignalement, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @PatchMapping("/{id}/statut")
    public ResponseEntity<Signalement> updateStatut(@PathVariable Long id, @RequestParam String statut) {
        try {
            Signalement updatedSignalement = signalementService.updateStatut(id, statut);
            return new ResponseEntity<>(updatedSignalement, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        signalementService.deleteSignalement(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<Signalement>> getSignalementsByUser(@PathVariable String userId) {
        List<Signalement> signalements = signalementService.getSignalementsByUser(userId);
        return new ResponseEntity<>(signalements, HttpStatus.OK);
    }
    
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Signalement>> getSignalementsByStatut(@PathVariable String statut) {
        List<Signalement> signalements = signalementService.getSignalementsByStatut(statut);
        return new ResponseEntity<>(signalements, HttpStatus.OK);
    }
    
    @GetMapping("/periode")
    public ResponseEntity<List<Signalement>> getSignalementsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Signalement> signalements = signalementService.getSignalementsByDateRange(start, end);
        return new ResponseEntity<>(signalements, HttpStatus.OK);
    }
}
