package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.entities.*;
import com.itbs.clinique.repositories.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DossierMedicalServiceImpl implements DossierMedicalService {
    
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final MedecinRepository medecinRepository;

    public DossierMedicalServiceImpl(PatientRepository patientRepository,
                                     ConsultationRepository consultationRepository,
                                     MedecinRepository medecinRepository) {
        this.patientRepository = patientRepository;
        this.consultationRepository = consultationRepository;
        this.medecinRepository = medecinRepository;
    }

    @Override
    public DossierMedicalResponse consulterDossier(Long patientId, Long medecinUserId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        boolean aConsulte = consultationRepository
                .findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId)
                .stream()
                .anyMatch(c -> c.getRendezVous().getMedecin().getId().equals(vraiMedecinId));
        
        if (!aConsulte) {
            throw new RuntimeException("Vous n'avez pas consulté ce patient");
        }
        
        List<Consultation> consultations = consultationRepository
                .findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId);
        return DossierMedicalResponse.builder()
                .patientId(patient.getId())
                .patientNomComplet(patient.getNomComplet())
                .dateNaissance(patient.getDateNaissance())
                .dossierMedical(patient.getDossierMedical())
                .historiqueConsultations(consultations.stream()
                    .map(this::mapToResume)
                    .collect(Collectors.toList()))
                .build();
    }

    @Override
    public void mettreAJourDossierApresConsultation(Consultation consultation) {
        RendezVous rdv = consultation.getRendezVous();
        Patient patient = rdv.getPatient();
        Medecin medecin = rdv.getMedecin();
        
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
        
        // ✅ LOGIQUE DÉPLACÉE ICI (anciennement dans Patient.ajouterAuDossierMedical)
        String entree = String.format(
            "Consultation du %s avec Dr. %s (%s)\nDiagnostic: %s\nTraitement: %s\nOrdonnance: %s\n---",
            sdf.format(rdv.getDate()),  // ✅ Utilise la date du RDV
            medecin.getNomComplet(),
            medecin.getSpecialite(),
            consultation.getDiagnostic() != null ? consultation.getDiagnostic() : "Non spécifié",
            consultation.getTraitement() != null ? consultation.getTraitement() : "Aucun",
            consultation.getOrdonnance() != null ? consultation.getOrdonnance() : "Aucune"
        );
        
        // Ajouter au dossier existant (le plus récent en premier)
        String dossierActuel = patient.getDossierMedical();
        String nouveauDossier;
        
        if (dossierActuel == null || dossierActuel.isEmpty()) {
            nouveauDossier = entree;
        } else {
            nouveauDossier = entree + "\n\n" + dossierActuel;
        }
        
        patient.setDossierMedical(nouveauDossier);
        patientRepository.save(patient);
        
        // Mettre à jour aussi l'historique des consultations
        consultationRepository.save(consultation);
    }
    
    private Long getMedecinIdFromUserId(Long userId) {
        return medecinRepository.findByUserUserId(userId)
                .map(Medecin::getId)
                .orElse(userId);
    }
    
    // ✅ MÉTHODE CORRIGÉE : utilise rdv.getDate() au lieu de c.getDateConsultation()
    private ConsultationResumeResponse mapToResume(Consultation c) {
        return ConsultationResumeResponse.builder()
                .id(c.getId())
                .date(c.getRendezVous().getDate())  // ✅ CORRIGÉ
                .medecinNom(c.getRendezVous().getMedecin().getNomComplet())
                .specialite(c.getRendezVous().getMedecin().getSpecialite())
                .diagnostic(c.getDiagnostic())
                .build();
    }
    
 // DossierMedicalServiceImpl.java - Ajouter cette méthode

    @Override
    public DossierMedicalResponse updateDossierMedical(Long patientId, Long medecinUserId, String dossierMedical) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        boolean aConsulte = consultationRepository
                .findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId)
                .stream()
                .anyMatch(c -> c.getRendezVous().getMedecin().getId().equals(vraiMedecinId));
        
        if (!aConsulte) {
            throw new RuntimeException("Vous n'avez pas consulté ce patient");
        }
        
        // Mettre à jour le dossier médical
        patient.setDossierMedical(dossierMedical);
        patientRepository.save(patient);
        
        // Retourner le dossier mis à jour
        return DossierMedicalResponse.builder()
                .patientId(patient.getId())
                .patientNomComplet(patient.getNomComplet())
                .dateNaissance(patient.getDateNaissance())
                .dossierMedical(patient.getDossierMedical())
                .historiqueConsultations(consultationRepository
                    .findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId)
                    .stream()
                    .map(this::mapToResume)
                    .collect(Collectors.toList()))
                .build();
    }

    @Override
    public DossierMedicalResponse consulterMonDossier(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        List<Consultation> consultations = consultationRepository
                .findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId);
        
        return DossierMedicalResponse.builder()
                .patientId(patient.getId())
                .patientNomComplet(patient.getNomComplet())
                .dateNaissance(patient.getDateNaissance())
                .dossierMedical(patient.getDossierMedical())
                .historiqueConsultations(consultations.stream()
                    .map(this::mapToResume)
                    .collect(Collectors.toList()))
                .build();
    }
}