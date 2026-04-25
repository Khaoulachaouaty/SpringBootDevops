package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class ConsultationResponse {
    private Long id;
    private Date dateConsultation;
    private String diagnostic;
    private String ordonnance;
    private String traitement;
    private String notes;
    
    // Facturation
    private double prixConsultation;
    private double montantMedicaments;
    private double montantTotal;
    private String statutPaiement;
    
    // Rendez-vous info
    private Long rendezVousId;
    private Date dateRendezVous;
    private String heureRendezVous;
    
    // Patient info
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private String patientEmail;
    
    // Médecin info
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private String medecinSpecialite;
}