package com.itbs.clinique.controller;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.services.ConsultationService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "*")
public class ConsultationController {
    
    private static final Logger logger = LoggerFactory.getLogger(ConsultationController.class);
    
    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    // ==================== CONSULTATIONS ====================
    
    @PostMapping
    public ResponseEntity<ConsultationResponse> createConsultation(
            @Valid @RequestBody ConsultationRequest request) {
        logger.info("📝 Nouvelle consultation pour RDV: {}", request.getRendezVousId());
        return ResponseEntity.ok(consultationService.createConsultation(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponse> getConsultation(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.getConsultationById(id));
    }

    @GetMapping("/rendezvous/{rendezVousId}")
    public ResponseEntity<ConsultationResponse> getByRendezVous(@PathVariable Long rendezVousId) {
        return ResponseEntity.ok(consultationService.getConsultationByRendezVous(rendezVousId));
    }

    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<ConsultationResponse>> getByMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(consultationService.getConsultationsByMedecin(medecinId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ConsultationResponse>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(consultationService.getConsultationsByPatient(patientId));
    }

    // ==================== FACTURES ====================
    
    @GetMapping("/{id}/facture")
    public ResponseEntity<FactureResponse> genererFacture(@PathVariable Long id) {
        logger.info("📄 Génération facture pour consultation: {}", id);
        return ResponseEntity.ok(consultationService.genererFacture(id));
    }

    @GetMapping("/patient/{patientId}/factures")
    public ResponseEntity<List<FactureResponse>> getFacturesPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(consultationService.getFacturesByPatient(patientId));
    }

    @PutMapping("/{id}/paiement")
    public ResponseEntity<FactureResponse> updatePaiement(
            @PathVariable Long id,
            @RequestParam String statut) {
        logger.info("💳 Mise à jour paiement: {} -> {}", id, statut);
        return ResponseEntity.ok(consultationService.updateStatutPaiement(id, statut));
    }

    @GetMapping("/medecin/{medecinId}/revenus")
    public ResponseEntity<Double> getRevenusMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(consultationService.calculerRevenusMedecin(medecinId));
    }
    
 // Générer facture PDF (après paiement)
    @GetMapping("/{id}/facture/pdf")
    public ResponseEntity<FactureResponse> genererFacturePDF(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.genererFacturePDF(id));
    }

    // Statistiques pour le médecin
    @GetMapping("/medecin/{medecinId}/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques(
            @PathVariable Long medecinId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date debut,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date fin) {
        return ResponseEntity.ok(consultationService.getStatistiquesFacturation(medecinId, debut, fin));
    }
}