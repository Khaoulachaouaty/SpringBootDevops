package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private Date dateEnvoi;
    private Date dateLecture;
    private String type;
    private String statut;
    private String donnees;
    
    // Info liée
    private Long rendezVousId;
    private String patientNom;
    private String medecinNom;
}
