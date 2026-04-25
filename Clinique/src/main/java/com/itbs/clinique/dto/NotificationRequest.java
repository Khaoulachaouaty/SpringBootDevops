package com.itbs.clinique.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {
    
    @NotNull(message = "L'ID du patient est obligatoire")
    private Long patientId;
    
    private Long medecinId;
    private Long rendezVousId;
    
    @NotBlank(message = "Le message est obligatoire")
    private String message;
    
    @NotBlank(message = "Le type est obligatoire")
    private String type; // RAPPEL_RDV, CONFIRMATION_RDV, etc.
    
    private String donnees; // JSON optionnel
}