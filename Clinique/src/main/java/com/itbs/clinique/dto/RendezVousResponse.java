package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class RendezVousResponse {
    private Long id;
    private Date date;
    private String heure;
    private String motif;
    private String statut;
    
    // Patient info
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private String patientEmail;
    private String patientTel;
    
    // Médecin info
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private String medecinSpecialite;
}


