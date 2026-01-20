package com.projet.route.controller;

import com.projet.route.models.Travaux;
import com.projet.route.services.TravauxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/travaux")
public class TravauxController {
    
    @Autowired
    private TravauxService travauxService;
    
    @GetMapping
    public ResponseEntity<List<Travaux>> getAllTravaux() {
        List<Travaux> travaux = travauxService.getAllTravaux();
        return new ResponseEntity<>(travaux, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Travaux> getTravauxById(@PathVariable Long id) {
        return travauxService.getTravauxById(id)
                .map(travaux -> new ResponseEntity<>(travaux, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @GetMapping("/signalement/{signalementId}")
    public ResponseEntity<Travaux> getTravauxBySignalementId(@PathVariable Long signalementId) {
        return travauxService.getTravauxBySignalementId(signalementId)
                .map(travaux -> new ResponseEntity<>(travaux, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<Travaux> createTravaux(@RequestBody Travaux travaux) {
        Travaux createdTravaux = travauxService.createTravaux(travaux);
        return new ResponseEntity<>(createdTravaux, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Travaux> updateTravaux(@PathVariable Long id, @RequestBody Travaux travaux) {
        try {
            Travaux updatedTravaux = travauxService.updateTravaux(id, travaux);
            return new ResponseEntity<>(updatedTravaux, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTravaux(@PathVariable Long id) {
        travauxService.deleteTravaux(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/en-cours")
    public ResponseEntity<List<Travaux>> getTravauxEnCours() {
        List<Travaux> travaux = travauxService.getTravauxEnCours();
        return new ResponseEntity<>(travaux, HttpStatus.OK);
    }
}