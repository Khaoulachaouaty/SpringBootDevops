package com.itbs.clinique.entities;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"patient", "medecin", "consultation"}) // 🔥 AJOUTÉ
@EqualsAndHashCode(exclude = {"patient", "medecin", "consultation"}) // 🔥 AJOUTÉ

public class RendezVous {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Date date;
    private String heure;
    private String motif;
    private String statut;
    
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
    
    @OneToOne(mappedBy = "rendezVous")
    private Consultation consultation;
}