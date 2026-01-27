package com.projet.route.controller;

import com.projet.route.models.Signalement;
import com.projet.route.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "*")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

    @GetMapping
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Signalement> getSignalementById(@PathVariable Long id) {
        Optional<Signalement> signalement = signalementRepository.findById(id);
        if (signalement.isPresent()) {
            return ResponseEntity.ok(signalement.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public Signalement createSignalement(@RequestBody Signalement signalement) {
        return signalementRepository.save(signalement);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Signalement> updateSignalement(@PathVariable Long id, @RequestBody Signalement signalementDetails) {
        Optional<Signalement> optionalSignalement = signalementRepository.findById(id);
        if (optionalSignalement.isPresent()) {
            Signalement signalement = optionalSignalement.get();
            signalement.setSurface(signalementDetails.getSurface());
            signalement.setLatitude(signalementDetails.getLatitude());
            signalement.setLongitude(signalementDetails.getLongitude());
            signalement.setTypeProbleme(signalementDetails.getTypeProbleme());
            signalement.setStatut(signalementDetails.getStatut());
            signalement.setDescription(signalementDetails.getDescription());
            signalement.setLieux(signalementDetails.getLieux());

            Signalement updatedSignalement = signalementRepository.save(signalement);
            return ResponseEntity.ok(updatedSignalement);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        Optional<Signalement> signalement = signalementRepository.findById(id);
        if (signalement.isPresent()) {
            signalementRepository.delete(signalement.get());
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}