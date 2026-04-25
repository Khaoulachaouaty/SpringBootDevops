package com.itbs.clinique.entities;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"patient", "medecin", "rendezVous"}) // 🔥 AJOUTÉ
@EqualsAndHashCode(exclude = {"patient", "medecin", "rendezVous"}) // 🔥 AJOUTÉ

public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String message;
    private Date dateEnvoi;
    private Date dateLecture;
    private String type; // RAPPEL_RDV, CONFIRMATION_RDV, ANNULATION_RDV, FACTURE, SYSTEME
    private String statut; // NON_LUE, LUE, ENVOYEE
    
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
    
    @ManyToOne
    @JoinColumn(name = "rendez_vous_id")
    private RendezVous rendezVous;
    
    // Données supplémentaires selon le type
    private String donnees; // JSON pour données flexibles
}