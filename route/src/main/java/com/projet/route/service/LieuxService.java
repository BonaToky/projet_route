package com.projet.route.service;

import com.projet.route.models.Lieux;
import com.projet.route.repository.LieuxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LieuxService {
    
    @Autowired
    private LieuxRepository lieuxRepository;
    
    // Créer un nouveau lieu
    public Lieux createLieux(Lieux lieux) {
        // Vérifier si le libellé existe déjà
        if (lieuxRepository.existsByLibelle(lieux.getLibelle())) {
            throw new RuntimeException("Un lieu avec le libellé '" + lieux.getLibelle() + "' existe déjà");
        }
        return lieuxRepository.save(lieux);
    }
    
    // Récupérer tous les lieux
    public List<Lieux> getAllLieux() {
        return lieuxRepository.findAll();
    }
    
    // Récupérer un lieu par ID
    public Optional<Lieux> getLieuxById(Long id) {
        return lieuxRepository.findById(id);
    }
    
    // Mettre à jour un lieu
    public Optional<Lieux> updateLieux(Long id, Lieux lieuxDetails) {
        return lieuxRepository.findById(id).map(existingLieux -> {
            // Vérifier si le nouveau libellé n'existe pas déjà (sauf pour le même lieu)
            if (!existingLieux.getLibelle().equals(lieuxDetails.getLibelle()) 
                && lieuxRepository.existsByLibelle(lieuxDetails.getLibelle())) {
                throw new RuntimeException("Un lieu avec le libellé '" + lieuxDetails.getLibelle() + "' existe déjà");
            }
            
            existingLieux.setLibelle(lieuxDetails.getLibelle());
            existingLieux.setVille(lieuxDetails.getVille());
            existingLieux.setDescription(lieuxDetails.getDescription());
            
            return lieuxRepository.save(existingLieux);
        });
    }
    
    // Supprimer un lieu
    public boolean deleteLieux(Long id) {
        if (lieuxRepository.existsById(id)) {
            lieuxRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    // Rechercher par mot-clé
    public List<Lieux> searchLieux(String keyword) {
        return lieuxRepository.searchByKeyword(keyword);
    }
    
    // Récupérer les lieux par ville
    public List<Lieux> getLieuxByVille(String ville) {
        return lieuxRepository.findByVille(ville);
    }
    
    // Vérifier si un lieu existe
    public boolean existsById(Long id) {
        return lieuxRepository.existsById(id);
    }
    
    // Récupérer les statistiques
    public long getTotalCount() {
        return lieuxRepository.count();
    }
    
    // Créer plusieurs lieux de test
    public void createSampleLieux() {
        if (lieuxRepository.count() == 0) {
            String[] villes = {"Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga"};
            String[] types = {"Route", "Carrefour", "Pont", "Tunnel", "Passage piéton"};
            
            for (int i = 1; i <= 10; i++) {
                Lieux lieu = new Lieux();
                lieu.setLibelle(types[i % types.length] + " " + i);
                lieu.setVille(villes[i % villes.length]);
                lieu.setDescription("Description pour " + lieu.getLibelle() + " à " + lieu.getVille());
                lieuxRepository.save(lieu);
            }
        }
    }
}
