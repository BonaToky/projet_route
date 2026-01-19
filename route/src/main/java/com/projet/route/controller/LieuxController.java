package com.projet.route.controller;

import com.projet.route.model.Lieux;
import com.projet.route.service.LieuxService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lieux")
public class LieuxController {

    private final LieuxService lieuxService;

    public LieuxController(LieuxService lieuxService) {
        this.lieuxService = lieuxService;
    }

    @GetMapping
    public List<Lieux> getAllLieux() {
        return lieuxService.getAllLieux();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lieux> getLieuxById(@PathVariable Integer id) {
        return lieuxService.getLieuxById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Lieux createLieux(@RequestBody Lieux lieux) {
        return lieuxService.saveLieux(lieux);
    }

    @PutMapping("/{id}")
    public Lieux updateLieux(@PathVariable Integer id, @RequestBody Lieux lieux) {
        return lieuxService.updateLieux(id, lieux);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLieux(@PathVariable Integer id) {
        lieuxService.deleteLieux(id);
        return ResponseEntity.noContent().build();
    }
}

