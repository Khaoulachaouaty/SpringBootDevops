package com.itbs.clinique.controller;

import com.itbs.clinique.dto.MedecinResponse;
import com.itbs.clinique.services.MedecinService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class PublicController {
    
    private final MedecinService medecinService;

    public PublicController(MedecinService medecinService) {
        this.medecinService = medecinService;
    }

    // GET /api/public/medecins - Liste publique
    @GetMapping("/medecins")
    public ResponseEntity<List<MedecinResponse>> getAllMedecins() {
        return ResponseEntity.ok(medecinService.getAllMedecins());
    }

    // GET /api/public/medecins/specialite/{specialite}
    @GetMapping("/medecins/specialite/{specialite}")
    public ResponseEntity<List<MedecinResponse>> getBySpecialite(
            @PathVariable String specialite) {
        return ResponseEntity.ok(medecinService.getMedecinsBySpecialite(specialite));
    }
}