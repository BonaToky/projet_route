package com.projet.route.service;

import com.google.firebase.messaging.*;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private Firestore firestore;
    
    public void sendStatusUpdateNotification(String userId, String signalementId, String oldStatus, String newStatus) {
        try {
            logger.info("📨 Tentative d'envoi de notification - userId: {}, signalementId: {}", userId, signalementId);
            
            // Récupérer le token FCM de l'utilisateur depuis la collection "utilisateurs"
            DocumentSnapshot userDoc = firestore.collection("utilisateurs").document(userId).get().get();
            
            if (!userDoc.exists()) {
                logger.warn("Utilisateur non trouvé: {}", userId);
                return;
            }
            
            String fcmToken = userDoc.getString("fcmToken");
            if (fcmToken == null || fcmToken.isEmpty()) {
                logger.warn("Token FCM non trouvé pour l'utilisateur: {}", userId);
                return;
            }
            
            // Créer le message de notification
            String title = "Mise à jour de votre signalement";
            String body = String.format("Le statut de votre signalement est passé de '%s' à '%s'", 
                getStatusLabel(oldStatus), getStatusLabel(newStatus));
            
            // Données supplémentaires pour la notification
            Map<String, String> data = new HashMap<>();
            data.put("signalementId", signalementId);
            data.put("oldStatus", oldStatus);
            data.put("newStatus", newStatus);
            data.put("type", "status_update");
            
            // Créer le message FCM
            Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .putAllData(data)
                .setAndroidConfig(AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                        .setSound("default")
                        .setColor("#3B82F6")
                        .setChannelId("status_updates")
                        .build())
                    .build())
                .build();
            
            // Envoyer la notification
            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Notification envoyée avec succès: {}", response);
            
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Erreur lors de l'envoi de la notification", e);
        } catch (FirebaseMessagingException e) {
            logger.error("Erreur Firebase Messaging", e);
        }
    }
    
    private String getStatusLabel(String status) {
        switch (status) {
            case "non traité":
                return "Nouveau";
            case "en cours":
                return "En cours";
            case "résolu":
                return "Terminé";
            default:
                return status;
        }
    }
}
