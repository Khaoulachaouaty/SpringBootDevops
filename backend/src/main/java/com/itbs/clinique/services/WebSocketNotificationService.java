package com.itbs.clinique.services;

import com.itbs.clinique.dto.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketNotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketNotificationService.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Envoyer une notification à un patient spécifique
     * @param patientId L'ID du patient
     * @param notification La notification à envoyer
     */
    public void envoyerNotificationPatient(Long patientId, NotificationResponse notification) {
        logger.info("📡 WebSocket -> Notification au patient {}: {}", patientId, notification.getMessage());
        
        // Destination: /user/{patientId}/queue/notifications
        messagingTemplate.convertAndSendToUser(
            String.valueOf(patientId),
            "/queue/notifications",
            notification
        );
    }
    
    /**
     * Envoyer une notification à un médecin spécifique
     * @param medecinId L'ID du médecin
     * @param notification La notification à envoyer
     */
    public void envoyerNotificationMedecin(Long medecinId, NotificationResponse notification) {
        logger.info("📡 WebSocket -> Notification au médecin {}: {}", medecinId, notification.getMessage());
        
        // Destination: /user/medecin_{medecinId}/queue/notifications
        messagingTemplate.convertAndSendToUser(
            "medecin_" + medecinId,
            "/queue/notifications",
            notification
        );
    }
    
    /**
     * Envoyer une notification à tout le monde (broadcast)
     * Utile pour les annonces système
     */
    public void envoyerNotificationGlobale(NotificationResponse notification) {
        logger.info("📡 WebSocket -> Notification globale: {}", notification.getMessage());
        messagingTemplate.convertAndSend("/topic/global", notification);
    }
}