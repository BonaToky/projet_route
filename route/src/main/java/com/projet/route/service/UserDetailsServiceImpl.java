package com.projet.route.service;

import com.projet.route.entity.Utilisateur;
import com.projet.route.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    public UserDetailsServiceImpl(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur user = utilisateurRepository. findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getMotDePasse())  // Plain text
            .roles(user.getRole() != null ? user.getRole().getNom() : "USER")
            .disabled(user.getEstBloque())
            .build();
    }
}