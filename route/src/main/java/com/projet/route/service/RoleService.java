package com.projet.route.service;

import com.projet.route.models.Role;
import com.projet.route.repository.RoleRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RoleService {
    
    private final RoleRepository roleRepository;
    
    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }
    
    /**
     * Récupère tous les rôles
     */
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    
    /**
     * Récupère un rôle par son ID
     */
    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }
    
    /**
     * Récupère un rôle par son nom
     */
    public Role getRoleByNom(String nom) {
        return roleRepository.findByNom(nom);
    }
    
    /**
     * Crée un nouveau rôle
     */
    public Role createRole(Role role) {
        return roleRepository.save(role);
    }
    
    /**
     * Met à jour un rôle
     */
    public Role updateRole(Long id, Role roleDetails) {
        return roleRepository.findById(id).map(role -> {
            role.setNom(roleDetails.getNom());
            return roleRepository.save(role);
        }).orElseThrow(() -> new RuntimeException("Rôle non trouvé avec l'id: " + id));
    }
    
    /**
     * Supprime un rôle
     */
    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }
}
