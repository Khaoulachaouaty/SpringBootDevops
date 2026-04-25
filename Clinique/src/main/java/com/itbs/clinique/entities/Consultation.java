package com.itbs.clinique.entities;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@ToString(exclude = {"rendezVous"}) // 🔥 AJOUTÉ
@EqualsAndHashCode(exclude = {"rendezVous"}) // 🔥 

public class Consultation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String diagnostic;
    private String ordonnance;
    private String traitement;
    private String notes;
    
    // Facturation
    private double prixConsultation;
    private double montantMedicaments;
    private double montantTotal;
    private String statutPaiement; // EN_ATTENTE, PAYE, ANNULE
    
    @OneToOne
    @JoinColumn(name = "rendez_vous_id")
    private RendezVous rendezVous;
    
    // Méthode utilitaire pour calculer le total
    public void calculerTotal() {
        this.montantTotal = this.prixConsultation + this.montantMedicaments;
    }
}