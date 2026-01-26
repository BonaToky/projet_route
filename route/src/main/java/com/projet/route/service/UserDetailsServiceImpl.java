package com.projet.route.service;

import com.projet.route.models.Utilisateur;
import com.projet.route.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    private final UtilisateurRepository utilisateurRepository;

    public UserDetailsServiceImpl(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("Loading user by email: {}", email);
        Utilisateur user = utilisateurRepository. findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        logger.info("User found: {}, password: {}", user.getEmail(), user.getMotDePasse());
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getMotDePasse())  // Plain text
            // .roles(user.getRole() != null ? user.getRole().getNom() : "USER")
            .disabled(user.getEstBloque())
            .build();
    }
}