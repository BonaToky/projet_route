package com.projet.route.service;

import com.projet.route.models.Utilisateur;
import com.projet.route.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UtilisateurService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;
    
    // Créer un utilisateur
    public Utilisateur createUtilisateur(Utilisateur utilisateur) {
        // Vérifier si l'utilisateur existe déjà
        if (utilisateurRepository.existsByNomUtilisateur(utilisateur.getNomUtilisateur())) {
            throw new RuntimeException("Le nom d'utilisateur est déjà utilisé");
        }
        
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new RuntimeException("L'email est déjà utilisé");
        }
        
        // Encoder le mot de passe si un PasswordEncoder est disponible
        if (passwordEncoder != null) {
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        }
        
        // Définir les valeurs par défaut
        if (utilisateur.getSourceAuth() == null) {
            utilisateur.setSourceAuth("local");
        }
        
        return utilisateurRepository.save(utilisateur);
    }
    
    // Récupérer tous les utilisateurs
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }
    
    // Récupérer un utilisateur par ID
    public Optional<Utilisateur> getUtilisateurById(Long id) {
        return utilisateurRepository.findById(id);
    }
    
    // Récupérer un utilisateur par nom d'utilisateur
    public Optional<Utilisateur> getUtilisateurByNom(String nomUtilisateur) {
        return utilisateurRepository.findByNomUtilisateur(nomUtilisateur);
    }
    
    // Récupérer un utilisateur par email
    public Optional<Utilisateur> getUtilisateurByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }
    
    // Mettre à jour un utilisateur
    public Utilisateur updateUtilisateur(Long id, Utilisateur utilisateurDetails) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
        
        // Mettre à jour les champs
        if (utilisateurDetails.getEmail() != null && !utilisateurDetails.getEmail().equals(utilisateur.getEmail())) {
            if (utilisateurRepository.existsByEmail(utilisateurDetails.getEmail())) {
                throw new RuntimeException("L'email est déjà utilisé");
            }
            utilisateur.setEmail(utilisateurDetails.getEmail());
        }
        
        if (utilisateurDetails.getIdRole() != null) {
            utilisateur.setIdRole(utilisateurDetails.getIdRole());
        }
        
        if (utilisateurDetails.getMotDePasse() != null && !utilisateurDetails.getMotDePasse().isEmpty()) {
            if (passwordEncoder != null) {
                utilisateur.setMotDePasse(passwordEncoder.encode(utilisateurDetails.getMotDePasse()));
            } else {
                utilisateur.setMotDePasse(utilisateurDetails.getMotDePasse());
            }
        }
        
        if (utilisateurDetails.getEstBloque() != null) {
            utilisateur.setEstBloque(utilisateurDetails.getEstBloque());
        }
        
        if (utilisateurDetails.getSourceAuth() != null) {
            utilisateur.setSourceAuth(utilisateurDetails.getSourceAuth());
        }
        
        return utilisateurRepository.save(utilisateur);
    }
    
    // Supprimer un utilisateur
    public void deleteUtilisateur(Long id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé avec l'ID: " + id);
        }
        utilisateurRepository.deleteById(id);
    }
    
    // Rechercher par mot-clé
    public List<Utilisateur> searchUtilisateurs(String keyword) {
        return utilisateurRepository.searchByKeyword(keyword);
    }
    
    // Récupérer les utilisateurs bloqués
    public List<Utilisateur> getUtilisateursBloques() {
        return utilisateurRepository.findByEstBloque(true);
    }
    
    // Récupérer les utilisateurs non bloqués
    public List<Utilisateur> getUtilisateursNonBloques() {
        return utilisateurRepository.findByEstBloque(false);
    }
    
    // Récupérer par rôle
    public List<Utilisateur> getUtilisateursByRole(Integer idRole) {
        return utilisateurRepository.findByIdRole(idRole);
    }
    
    // Réinitialiser les tentatives d'échec
    public void reinitialiserTentativesEchec(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
        utilisateur.reinitialiserTentativesEchec();
        utilisateurRepository.save(utilisateur);
    }
    
    // Vérifier si un utilisateur existe par nom d'utilisateur
    public boolean existsByNomUtilisateur(String nomUtilisateur) {
        return utilisateurRepository.existsByNomUtilisateur(nomUtilisateur);
    }
    
    // Vérifier si un utilisateur existe par email
    public boolean existsByEmail(String email) {
        return utilisateurRepository.existsByEmail(email);
    }
}
