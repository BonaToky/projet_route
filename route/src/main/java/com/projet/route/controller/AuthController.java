package com.projet.route.controller;

import com.projet.route.models.ParametreAuth;
import com.projet.route.models.Role;
import com.projet.route.models.Session;
import com.projet.route.models.Utilisateur;
import com.projet.route.repository.ParametreAuthRepository;
import com.projet.route.repository.RoleRepository;
import com.projet.route.repository.SessionRepository;
import com.projet.route.repository.UtilisateurRepository;
import com.projet.route.service.AuthService;
import com.projet.route.repository.RoleRepository;
import com.projet.route.repository.SessionRepository;
import com.projet.route.repository.UtilisateurRepository;
import com.projet.route.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final AuthService authService;
    private final ParametreAuthRepository parametreAuthRepository;

    public AuthController(AuthenticationManager authenticationManager,
                         UtilisateurRepository utilisateurRepository,
                         RoleRepository roleRepository,
                         AuthService authService,
                         ParametreAuthRepository parametreAuthRepository) {
        this.authenticationManager = authenticationManager;
        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.authService = authService;
        this.parametreAuthRepository = parametreAuthRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(utilisateurRepository.findAll());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());

        Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            logger.warn("User not found for email: {}", request.getEmail());
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        Utilisateur user = userOpt.get();

        // Vérifier si le compte est bloqué
        if (authService.isAccountLocked(user)) {
            logger.warn("Account blocked for email: {}", request.getEmail());
            return ResponseEntity.status(403).body("Account blocked due to too many failed attempts");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            logger.info("Authentication successful for email: {}", request.getEmail());

            // Réinitialiser les tentatives échouées
            authService.resetFailedLoginAttempts(user);

            // Créer une session
            Session session = authService.createSession(user);

            LoginResponse response = new LoginResponse();
            response.setUser(user);
            response.setToken(session.getToken());
            response.setExpiresAt(session.getDateExpiration());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Login failed for email: {} with error: {}", request.getEmail(), e.getMessage());

            // Enregistrer la tentative échouée
            authService.recordFailedLoginAttempt(user);

            return ResponseEntity.status(401).body("Invalid credentials");
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
            if (user != null && authService.isAccountLocked(user)) {
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
                authService.resetFailedLoginAttempts(user);
            }

            // Créer une session
            Session session = authService.createSession(user);

            FirebaseLoginResponse response = new FirebaseLoginResponse();
            response.setUser(user);
            response.setToken(session.getToken());
            response.setExpiresAt(session.getDateExpiration());

            return ResponseEntity.ok(response);
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            // Extract email from invalid token
            String email = extractEmailFromToken(request.getToken());
            if (email != null) {
                Utilisateur user = utilisateurRepository.findByEmail(email).orElse(null);
                
                // Créer l'utilisateur s'il n'existe pas encore
                if (user == null) {
                    Role role = roleRepository.findByNom("UTILISATEUR");
                    user = new Utilisateur();
                    user.setNomUtilisateur("Firebase User"); // Nom temporaire
                    user.setEmail(email);
                    user.setMotDePasse("firebase");
                    user.setRole(role);
                    user.setSourceAuth("firebase");
                    user.setTentativesEchec(0); // Initialiser à 0
                    utilisateurRepository.save(user);
                }
                
                // Compter la tentative échouée
                int tentatives = user.getTentativesEchec() != null ? user.getTentativesEchec() : 0;
                tentatives += 1;
                user.setTentativesEchec(tentatives);
                
                if (tentatives >= authService.getMaxLoginAttempts()) {
                    user.setEstBloque(true);
                }
                
                user.setDateModification(LocalDateTime.now());
                utilisateurRepository.save(user);
            }
            return ResponseEntity.status(401).body("Invalid Firebase token: " + e.getMessage());
        }
    }

    @PostMapping("/report-failed-login")
    public ResponseEntity<?> reportFailedLogin(@RequestBody FailedLoginRequest request) {
        try {
            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(request.getEmail());
            Utilisateur user;
            
            if (userOpt.isEmpty()) {
                // Créer l'utilisateur s'il n'existe pas
                Role role = roleRepository.findByNom("UTILISATEUR");
                user = new Utilisateur();
                user.setNomUtilisateur("Mobile User"); // Nom temporaire
                user.setEmail(request.getEmail());
                user.setMotDePasse("mobile");
                user.setRole(role);
                user.setSourceAuth("mobile");
                user.setTentativesEchec(0);
                utilisateurRepository.save(user);
            } else {
                user = userOpt.get();
            }
            
            // Vérifier si le compte est déjà bloqué
            if (authService.isAccountLocked(user)) {
                Map<String, Object> response = new HashMap<>();
                response.put("blocked", true);
                response.put("message", "Account already blocked");
                return ResponseEntity.ok(response);
            }
            
            // Compter la tentative échouée
            authService.recordFailedLoginAttempt(user);
            
            // Vérifier si le compte doit être bloqué
            boolean isBlocked = authService.isAccountLocked(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("blocked", isBlocked);
            response.put("attempts", user.getTentativesEchec());
            response.put("maxAttempts", authService.getMaxLoginAttempts());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error reporting failed login for email: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @PostMapping("/mobile-login")
    public ResponseEntity<?> mobileLogin(@RequestBody MobileLoginRequest request) {
        try {
            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(request.getEmail());
            Utilisateur user;
            
            if (userOpt.isEmpty()) {
                // Créer l'utilisateur s'il n'existe pas
                Role role = roleRepository.findByNom("UTILISATEUR");
                user = new Utilisateur();
                user.setNomUtilisateur(request.getNomUtilisateur());
                user.setEmail(request.getEmail());
                user.setMotDePasse("mobile"); // Mot de passe par défaut pour les utilisateurs mobiles
                user.setRole(role);
                user.setSourceAuth(request.getSourceAuth());
                user.setTentativesEchec(0);
                user.setEstBloque(false);
                utilisateurRepository.save(user);
                logger.info("Created new mobile user: {}", request.getEmail());
            } else {
                user = userOpt.get();
                // Mettre à jour le nom si nécessaire
                if (!user.getNomUtilisateur().equals(request.getNomUtilisateur())) {
                    user.setNomUtilisateur(request.getNomUtilisateur());
                    utilisateurRepository.save(user);
                }
            }
            
            return ResponseEntity.ok("Mobile user registered/updated successfully");
            
        } catch (Exception e) {
            logger.error("Error registering mobile user for email: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @PostMapping("/check-blocked")
    public ResponseEntity<?> checkAccountBlocked(@RequestBody FailedLoginRequest request) {
        try {
            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(request.getEmail());
            
            if (userOpt.isEmpty()) {
                // Si l'utilisateur n'existe pas encore, il n'est pas bloqué
                Map<String, Object> response = new HashMap<>();
                response.put("blocked", false);
                return ResponseEntity.ok(response);
            }
            
            Utilisateur user = userOpt.get();
            boolean isBlocked = authService.isAccountLocked(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("blocked", isBlocked);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error checking account blocked status for email: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @PostMapping("/reset-lock/{userId}")
    public ResponseEntity<?> resetUserLock(@PathVariable Long userId) {
        try {
            Optional<Utilisateur> userOpt = utilisateurRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Utilisateur user = userOpt.get();
            authService.resetFailedLoginAttempts(user);
            authService.invalidateUserSessions(userId); // Invalider les sessions existantes

            logger.info("Account lock reset for user: {}", user.getEmail());
            return ResponseEntity.ok("Account lock reset successfully");

        } catch (Exception e) {
            logger.error("Error resetting lock for user ID: {}", userId, e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @GetMapping("/params")
    public ResponseEntity<?> getAuthParams() {
        return ResponseEntity.ok(parametreAuthRepository.findAll());
    }

    @PutMapping("/params/{cle}")
    public ResponseEntity<?> updateAuthParam(@PathVariable String cle, @RequestBody ParamUpdateRequest request) {
        Optional<ParametreAuth> paramOpt = parametreAuthRepository.findByCle(cle);
        if (paramOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ParametreAuth param = paramOpt.get();
        param.setValeur(request.getValeur());
        parametreAuthRepository.save(param);

        logger.info("Auth parameter {} updated to: {}", cle, request.getValeur());
        return ResponseEntity.ok("Parameter updated successfully");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            Optional<Session> session = authService.validateSession(token);
            if (session.isPresent()) {
                session.get().setEstActive(false);
                // Note: sessionRepository is not injected, we'll need to add it
                // For now, we'll handle this in the service
                authService.invalidateUserSessions(session.get().getUtilisateur().getIdUtilisateur());
            }
        }
        return ResponseEntity.ok("Logged out successfully");
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

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request) {
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        Role role = roleRepository.findByNom("UTILISATEUR");
        Utilisateur user = new Utilisateur();
        user.setNomUtilisateur(request.getNomUtilisateur());
        user.setEmail(request.getEmail());
        user.setMotDePasse(request.getPassword());
        user.setRole(role);
        utilisateurRepository.save(user);
        return ResponseEntity.ok("User created successfully");
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        Optional<Utilisateur> optUser = utilisateurRepository.findById(id);
        if (!optUser.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        // Check if email is already used by another user
        Optional<Utilisateur> existingUser = utilisateurRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent() && !existingUser.get().getIdUtilisateur().equals(id)) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        Utilisateur user = optUser.get();
        user.setNomUtilisateur(request.getNomUtilisateur());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setMotDePasse(request.getPassword());
        }
        utilisateurRepository.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!utilisateurRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        utilisateurRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
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

    public static class UpdateUserRequest {
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

    public static class LoginResponse {
        private Utilisateur user;
        private String token;
        private java.time.LocalDateTime expiresAt;

        public Utilisateur getUser() { return user; }
        public void setUser(Utilisateur user) { this.user = user; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public java.time.LocalDateTime getExpiresAt() { return expiresAt; }
        public void setExpiresAt(java.time.LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    }

    public static class FirebaseLoginResponse {
        private Utilisateur user;
        private String token;
        private java.time.LocalDateTime expiresAt;

        public Utilisateur getUser() { return user; }
        public void setUser(Utilisateur user) { this.user = user; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public java.time.LocalDateTime getExpiresAt() { return expiresAt; }
        public void setExpiresAt(java.time.LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    }

    public static class ParamUpdateRequest {
        private String valeur;

        public String getValeur() { return valeur; }
        public void setValeur(String valeur) { this.valeur = valeur; }
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