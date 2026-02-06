package com.projet.route.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PushNotificationService {

    public void sendStatusChangeNotification(String fcmToken, String signalementId, String oldStatus, String newStatus) {
        if (fcmToken == null || fcmToken.isEmpty()) {
            System.out.println("No FCM token available for user");
            return;
        }

        try {
            String title = "Mise à jour de votre signalement";
            String body = String.format("Le statut de votre signalement est passé de '%s' à '%s'", oldStatus, newStatus);

            // Créer les données personnalisées
            Map<String, String> data = new HashMap<>();
            data.put("signalementId", signalementId);
            data.put("newStatus", newStatus);
            data.put("type", "status_change");

            // Créer la notification
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            // Créer le message
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(notification)
                    .putAllData(data)
                    .build();

            // Envoyer le message
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent notification: " + response);

        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendTravauxUpdateNotification(String fcmToken, String signalementId, int avancement) {
        if (fcmToken == null || fcmToken.isEmpty()) {
            System.out.println("No FCM token available for user");
            return;
        }

        try {
            String title = "Mise à jour des travaux";
            String body = String.format("Les travaux de votre signalement sont maintenant à %d%%", avancement);

            Map<String, String> data = new HashMap<>();
            data.put("signalementId", signalementId);
            data.put("avancement", String.valueOf(avancement));
            data.put("type", "travaux_update");

            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(notification)
                    .putAllData(data)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent travaux notification: " + response);

        } catch (Exception e) {
            System.err.println("Failed to send travaux notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
