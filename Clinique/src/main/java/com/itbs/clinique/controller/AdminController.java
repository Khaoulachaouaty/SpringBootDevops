package com.itbs.clinique.controller;


import com.itbs.clinique.dto.*;
import com.itbs.clinique.services.AuthService;
import com.itbs.clinique.services.MedecinService;
import com.itbs.clinique.services.PatientService;
import com.itbs.clinique.services.RendezVousService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    private final AuthService authService;
    private final PatientService patientService;
    private final MedecinService medecinService;
    private final RendezVousService rendezVousService;

    public AdminController(AuthService authService, 
                          PatientService patientService,
                          MedecinService medecinService, 
                          RendezVousService rendezVousService) {
        this.authService = authService;
        this.patientService = patientService;
        this.medecinService = medecinService;
        this.rendezVousService = rendezVousService;
    }

    // ==================== MÉDECINS ====================
    
    @PostMapping("/medecins")
    public ResponseEntity<AuthResponse> createMedecin(
            @Valid @RequestBody CreateMedecinRequest request) {
        logger.info("👨‍⚕️ Création médecin: {}", request.getEmail());
        return ResponseEntity.ok(authService.createMedecin(request));
    }

    @GetMapping("/medecins")
    public ResponseEntity<List<MedecinResponse>> getAllMedecins() {
        return ResponseEntity.ok(medecinService.getAllMedecins());
    }
    
    @GetMapping("/medecins/{id}")
    public ResponseEntity<MedecinResponse> getMedecinById(@PathVariable Long id) {
        return ResponseEntity.ok(medecinService.getMedecinById(id));
    }
    
    @GetMapping("/medecins/{id}/details")
    public ResponseEntity<Map<String, Object>> getMedecinDetails(@PathVariable Long id) {
        return ResponseEntity.ok(medecinService.getMedecinDetails(id));
    }

    @DeleteMapping("/medecins/{id}")
    public ResponseEntity<MessageResponse> deleteMedecin(@PathVariable Long id) {
        medecinService.deleteMedecin(id);
        return ResponseEntity.ok(new MessageResponse("Médecin supprimé avec succès", true));
    }
    
    // ==================== PATIENTS ====================
    
    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponse>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }
}