package com.projet.route.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.projet.route.model.Lieux;
import com.projet.route.model.RoutSignale;
import com.projet.route.repository.RoutSignaleRepository;

@Service
public class RoutSignaleService {

    private final RoutSignaleRepository routSignaleRepository;

    public RoutSignaleService(RoutSignaleRepository routSignaleRepository) {
        this.routSignaleRepository = routSignaleRepository;
    }

    // Récupérer tous les signalements
    public List<RoutSignale> getAllSignalements() {
        return routSignaleRepository.findAll();
    }

    // Récupérer un signalement par ID
    public Optional<RoutSignale> getSignalementById(Long id) {
        return routSignaleRepository.findById(id);
    }

    // Créer ou modifier un signalement
    public RoutSignale saveSignalement(RoutSignale signalement) {
        return routSignaleRepository.save(signalement);
    }

    // Supprimer un signalement
    public void deleteSignalement(Long id) {
        routSignaleRepository.deleteById(id);
    }

    // Récupérer les signalements d'un utilisateur
    public List<RoutSignale> getSignalementsByUser(String idUser) {
        return routSignaleRepository.findByIdUser(idUser);
    }

    // Récupérer les signalements d'un lieu
    public List<RoutSignale> getSignalementsByLieu(Lieux lieu) {
        return routSignaleRepository.findByLieux(lieu);
    }
}
