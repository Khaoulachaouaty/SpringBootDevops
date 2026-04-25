package com.itbs.clinique.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.itbs.clinique.dto.DossierMedicalResponse;
import com.itbs.clinique.services.DossierMedicalService;

@RestController
@RequestMapping("/api/dossiers-medicaux")
@CrossOrigin(origins = "*")
public class DossierMedicalController {
    
    private final DossierMedicalService dossierMedicalService;
    
    public DossierMedicalController(DossierMedicalService dossierMedicalService) {
        this.dossierMedicalService = dossierMedicalService;
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<DossierMedicalResponse> consulterDossier(
            @PathVariable Long patientId,
            @RequestParam Long medecinId) {
        return ResponseEntity.ok(dossierMedicalService.consulterDossier(patientId, medecinId));
    }
    
    // ✅ NOUVEAU ENDPOINT - Pour que le patient consulte son propre dossier
    @GetMapping("/patient/mon-dossier/{patientId}")
    public ResponseEntity<DossierMedicalResponse> consulterMonDossier(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(dossierMedicalService.consulterMonDossier(patientId));
    }

    @PutMapping("/patient/{patientId}")
    public ResponseEntity<DossierMedicalResponse> updateDossierMedical(
            @PathVariable Long patientId,
            @RequestParam Long medecinId,
            @RequestBody String dossierMedical) {
        return ResponseEntity.ok(dossierMedicalService.updateDossierMedical(patientId, medecinId, dossierMedical));
    }
}