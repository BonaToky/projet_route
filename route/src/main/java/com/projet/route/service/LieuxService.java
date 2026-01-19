package com.projet.route.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.projet.route.model.Lieux;
import com.projet.route.repository.LieuxRepository;

@Service
public class LieuxService {

    private final LieuxRepository lieuxRepository;

    public LieuxService(LieuxRepository lieuxRepository) {
        this.lieuxRepository = lieuxRepository;
    }

    public List<Lieux> getAllLieux() {
        return lieuxRepository.findAll();
    }

    public Optional<Lieux> getLieuxById(Integer id) {
        return lieuxRepository.findById(id);
    }

    public Lieux saveLieux(Lieux lieux) {
        return lieuxRepository.save(lieux);
    }

    public void deleteLieux(Integer id) {
        lieuxRepository.deleteById(id);
    }

    public Lieux updateLieux(Integer id, Lieux updatedLieux) {
        return lieuxRepository.findById(id).map(lieux -> {
            lieux.setLibelet(updatedLieux.getLibelet());
            lieux.setVille(updatedLieux.getVille());
            lieux.setDescription(updatedLieux.getDescription());
            return lieuxRepository.save(lieux);
        }).orElseThrow(() -> new RuntimeException("Lieu non trouvé avec id " + id));
    }
}

