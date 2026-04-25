package com.itbs.clinique.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ConsultationRequest {
    
    @NotNull(message = "L'ID du rendez-vous est obligatoire")
    private Long rendezVousId;
    
    private String diagnostic;
    private String ordonnance;
    private String traitement;
    private String notes;
    
    @Positive(message = "Le prix de consultation doit être positif")
    private double prixConsultation;
    
    @Positive(message = "Le montant des médicaments doit être positif")
    private double montantMedicaments;
}