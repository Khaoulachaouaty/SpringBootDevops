package com.itbs.clinique.controller;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.services.NotificationService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);
    
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ==================== CRÉATION ====================
    
    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody NotificationRequest request) {
        logger.info("🔔 Nouvelle notification pour patient: {}", request.getPatientId());
        return ResponseEntity.ok(notificationService.createNotification(request));
    }

    // ==================== LECTURE PATIENT ====================
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<NotificationResponse>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(notificationService.getNotificationsByPatient(patientId));
    }

    @GetMapping("/patient/{patientId}/non-lues")
    public ResponseEntity<List<NotificationResponse>> getNonLuesPatient(@PathVariable Long patientId) {
        // 🔥 CORRIGÉ : Ajout du type "PATIENT"
        return ResponseEntity.ok(notificationService.getNotificationsNonLues(patientId, "PATIENT"));
    }

    @GetMapping("/patient/{patientId}/count-non-lues")
    public ResponseEntity<Long> countNonLuesPatient(@PathVariable Long patientId) {
        // 🔥 CORRIGÉ : Ajout du type "PATIENT"
        return ResponseEntity.ok(notificationService.getNombreNotificationsNonLues(patientId, "PATIENT"));
    }

    // ==================== LECTURE MÉDECIN ====================
    
    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<NotificationResponse>> getByMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(notificationService.getNotificationsByMedecin(medecinId));
    }

    // 🔥 AJOUTÉ : Notifications non lues pour médecin
    @GetMapping("/medecin/{medecinId}/non-lues")
    public ResponseEntity<List<NotificationResponse>> getNonLuesMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(notificationService.getNotificationsNonLues(medecinId, "MEDECIN"));
    }

    // 🔥 AJOUTÉ : Compteur pour médecin
    @GetMapping("/medecin/{medecinId}/count-non-lues")
    public ResponseEntity<Long> countNonLuesMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(notificationService.getNombreNotificationsNonLues(medecinId, "MEDECIN"));
    }

    // ==================== ACTIONS ====================
    
    @PutMapping("/{id}/lue")
    public ResponseEntity<NotificationResponse> marquerLue(@PathVariable Long id) {
        logger.info("👁️ Notification marquée comme lue: {}", id);
        return ResponseEntity.ok(notificationService.marquerCommeLue(id));
    }

    @PutMapping("/patient/{patientId}/tout-lire")
    public ResponseEntity<MessageResponse> marquerToutLuePatient(@PathVariable Long patientId) {
        // 🔥 CORRIGÉ : Ajout du type "PATIENT"
        notificationService.marquerToutesCommeLues(patientId, "PATIENT");
        return ResponseEntity.ok(new MessageResponse("Toutes les notifications marquées comme lues", true));
    }

    // 🔥 AJOUTÉ : Tout lire pour médecin
    @PutMapping("/medecin/{medecinId}/tout-lire")
    public ResponseEntity<MessageResponse> marquerToutLueMedecin(@PathVariable Long medecinId) {
        notificationService.marquerToutesCommeLues(medecinId, "MEDECIN");
        return ResponseEntity.ok(new MessageResponse("Toutes les notifications marquées comme lues", true));
    }

    // ==================== SIMULATION ====================
    
    @PostMapping("/simuler/rappels")
    public ResponseEntity<MessageResponse> simulerRappels() {
        logger.info("🧪 Simulation envoi rappels...");
        notificationService.envoyerRappelsAutomatiques();
        return ResponseEntity.ok(new MessageResponse("Rappels simulés envoyés", true));
    }
}