package com.itbs.clinique.controller;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.services.RendezVousService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/rendezvous")
@CrossOrigin(origins = "*")
public class RendezVousController {
    
    private static final Logger logger = LoggerFactory.getLogger(RendezVousController.class);
    
    private final RendezVousService rendezVousService;
    
    public RendezVousController(RendezVousService rendezVousService) {
        this.rendezVousService = rendezVousService;
    }
    
    // ==================== PATIENT ====================
    
    @PostMapping
    public ResponseEntity<RendezVousResponse> createRendezVous(
            @Valid @RequestBody RendezVousRequest request) {
        logger.info("📅 Création RDV: patient={}, medecin={}, date={}", 
                   request.getPatientId(), request.getMedecinId(), request.getDate());
        return ResponseEntity.ok(rendezVousService.createRendezVous(request));
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<RendezVousResponse>> getRendezVousByPatient(
            @PathVariable Long patientId) {
        logger.info("📋 Liste RDV patient: {}", patientId);
        return ResponseEntity.ok(rendezVousService.getRendezVousByPatient(patientId));
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelRendezVous(
            @PathVariable Long id,
            @RequestParam Long patientId) {
        logger.info("❌ Annulation RDV: {} par patient: {}", id, patientId);
        rendezVousService.cancelRendezVous(id, patientId);
        return ResponseEntity.ok(new MessageResponse("Rendez-vous annulé avec succès", true));
    }
    
    // ==================== MEDECIN ====================
    
    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<RendezVousResponse>> getRendezVousByMedecin(
            @PathVariable Long medecinId) {
        logger.info("📋 Liste RDV médecin: {}", medecinId);
        return ResponseEntity.ok(rendezVousService.getRendezVousByMedecin(medecinId));
    }
    
    @GetMapping("/medecin/{medecinId}/today")
    public ResponseEntity<List<RendezVousResponse>> getRendezVousDuJour(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        logger.info("📅 RDV du jour médecin: {} date: {}", medecinId, date);
        return ResponseEntity.ok(rendezVousService.getRendezVousDuJour(medecinId, date));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<RendezVousResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody ConfirmRendezVousRequest request,
            @RequestParam Long medecinId) {
        
        // 🔥 LOG pour debug
        logger.info("🔍 Requête reçue: id={}, medecinId={}, request={}", id, medecinId, request);
        logger.info("🔍 Statut dans request: {}", request.getStatut());
        
        if (request.getStatut() == null) {
            logger.error("❌ Statut est NULL !");
            throw new RuntimeException("Le statut est obligatoire");
        }
        
        return ResponseEntity.ok(rendezVousService.updateStatus(id, request.getStatut(), medecinId));
    }

    @GetMapping("/medecin/{medecinId}/calendar")
    public ResponseEntity<List<CalendarEventResponse>> getCalendarEvents(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date end) {
        logger.info("📆 Calendrier médecin: {} du {} au {}", medecinId, start, end);
        return ResponseEntity.ok(rendezVousService.getCalendarEvents(medecinId, start, end));
    }
    
    // ==================== CRÉNEAUX ====================
    
    @GetMapping("/creneaux/{medecinId}")
    public ResponseEntity<List<String>> getCreneauxDisponibles(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        logger.info("⏰ Créneaux médecin: {} date: {}", medecinId, date);
        return ResponseEntity.ok(rendezVousService.getCreneauxDisponibles(medecinId, date));
    }
    
    @GetMapping("/creneaux/{medecinId}/occupes")
    public ResponseEntity<List<String>> getCreneauxOccupes(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        logger.info("🔴 Créneaux occupés médecin: {} date: {}", medecinId, date);
        return ResponseEntity.ok(rendezVousService.getCreneauxOccupes(medecinId, date));
    }
    
    // ==================== ADMIN ====================
    
    @GetMapping
    public ResponseEntity<List<RendezVousResponse>> getAllRendezVous() {
        logger.info("📋 Liste tous les RDV");
        return ResponseEntity.ok(rendezVousService.getAllRendezVous());
    }
    
    @GetMapping("/filter/patient/{patientId}")
    public ResponseEntity<List<RendezVousResponse>> filterByPatient(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(rendezVousService.filterByPatient(patientId));
    }
    
    @GetMapping("/filter/specialite/{specialite}")
    public ResponseEntity<List<RendezVousResponse>> filterBySpecialite(
            @PathVariable String specialite) {
        return ResponseEntity.ok(rendezVousService.filterBySpecialite(specialite));
    }
    
    @GetMapping("/filter/medecin/{medecinId}/date")
    public ResponseEntity<List<RendezVousResponse>> filterByMedecinAndDate(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        return ResponseEntity.ok(rendezVousService.filterByMedecinAndDate(medecinId, date));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RendezVousResponse> modifierRendezVous(
            @PathVariable Long id,
            @Valid @RequestBody RendezVousRequest request,
            @RequestParam Long patientId) {
        logger.info("✏️ Modification RDV: {} par patient: {}", id, patientId);
        return ResponseEntity.ok(rendezVousService.modifierRendezVous(id, request, patientId));
    }
}