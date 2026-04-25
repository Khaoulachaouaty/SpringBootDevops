package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class FactureResponse {
    private Long consultationId;
    private String numeroFacture;
    private Date dateFacture;
    
    // Patient
    private String patientNomComplet;
    private String patientEmail;
    private String patientTel;
    
    // Médecin
    private String medecinNomComplet;
    private String medecinSpecialite;
    
    // Détails
    private String motifConsultation;
    private Date dateRendezVous;
    
    // Montants
    private double prixConsultation;
    private double montantMedicaments;
    private double montantTotal;
    private String statutPaiement;
    
    // Méthode utilitaire pour générer numéro facture
    public static String genererNumero(Long id) {
        return "FAC-" + String.format("%06d", id) + "-" + new Date().getYear();
    }
}