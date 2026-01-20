package com.projet.route.controller;

import com.projet.route.entity.Role;
import com.projet.route.entity.Utilisateur;
import com.projet.route.repository.RoleRepository;
import com.projet.route.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;

    public AuthController(AuthenticationManager authenticationManager, UtilisateurRepository utilisateurRepository, RoleRepository roleRepository) {
        this.authenticationManager = authenticationManager;
        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(utilisateurRepository.findAll());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            return ResponseEntity.ok("Login successful");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        Role role = roleRepository.findByNom("UTILISATEUR");
        if (role == null) {
            return ResponseEntity.badRequest().body("Role not found");
        }
        Utilisateur user = new Utilisateur();
        user.setNomUtilisateur(request.getNomUtilisateur());
        user.setEmail(request.getEmail());
        user.setMotDePasse(request.getPassword());
        user.setRole(role);
        utilisateurRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<?> firebaseLogin(@RequestBody FirebaseLoginRequest request) {
        try {
            com.google.firebase.auth.FirebaseToken decodedToken = com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(request.getToken());
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            // Chercher l'utilisateur local
            Utilisateur user = utilisateurRepository.findByEmail(email).orElse(null);
            if (user != null && user.getEstBloque()) {
                return ResponseEntity.status(403).body("Account blocked due to too many failed attempts");
            }

            // Créer si inexistant
            if (user == null) {
                Role role = roleRepository.findByNom("UTILISATEUR");
                user = new Utilisateur();
                user.setNomUtilisateur(decodedToken.getName() != null ? decodedToken.getName() : uid);
                user.setEmail(email);
                user.setMotDePasse("firebase");
                user.setRole(role);
                user.setSourceAuth("firebase");
                utilisateurRepository.save(user);
            } else {
                // Reset tentatives on success
                user.setTentativesEchec(0);
                utilisateurRepository.save(user);
            }

            return ResponseEntity.ok("Firebase login successful for " + email);
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            // Extract email from invalid token
            String email = extractEmailFromToken(request.getToken());
            if (email != null) {
                Utilisateur user = utilisateurRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    int tentatives = user.getTentativesEchec() + 1;
                    user.setTentativesEchec(tentatives);
                    if (tentatives >= 3) {
                        user.setEstBloque(true);
                    }
                    utilisateurRepository.save(user);
                }
            }
            return ResponseEntity.status(401).body("Invalid Firebase token: " + e.getMessage());
        }
    }

    @PostMapping("/firebase-register")
    public ResponseEntity<?> firebaseRegister(@RequestBody FirebaseLoginRequest request) {
        try {
            com.google.firebase.auth.FirebaseToken decodedToken = com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(request.getToken());
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            if (utilisateurRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("User already exists");
            }

            Role role = roleRepository.findByNom("UTILISATEUR");
            Utilisateur user = new Utilisateur();
            user.setNomUtilisateur(decodedToken.getName() != null ? decodedToken.getName() : uid);
            user.setEmail(email);
            user.setMotDePasse("firebase");
            user.setRole(role);
            user.setSourceAuth("firebase");
            utilisateurRepository.save(user);

            return ResponseEntity.ok("Firebase register successful for " + email);
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Invalid Firebase token: " + e.getMessage());
        }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String nomUtilisateur;
        private String email;
        private String password;

        public String getNomUtilisateur() { return nomUtilisateur; }
        public void setNomUtilisateur(String nomUtilisateur) { this.nomUtilisateur = nomUtilisateur; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class FirebaseLoginRequest {
        private String token;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    private String extractEmailFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            // Simple JSON parse for email
            if (payload.contains("\"email\"")) {
                int start = payload.indexOf("\"email\":\"") + 9;
                int end = payload.indexOf("\"", start);
                return payload.substring(start, end);
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }
}