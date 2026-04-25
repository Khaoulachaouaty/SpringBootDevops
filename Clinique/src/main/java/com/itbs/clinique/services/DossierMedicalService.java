package com.itbs.clinique.services;

import com.itbs.clinique.dto.DossierMedicalResponse;
import com.itbs.clinique.entities.Consultation;

public interface DossierMedicalService {
    DossierMedicalResponse consulterDossier(Long patientId, Long medecinUserId);
    void mettreAJourDossierApresConsultation(Consultation consultation);
    DossierMedicalResponse updateDossierMedical(Long patientId, Long medecinUserId, String dossierMedical);
    
    // ✅ NOUVELLE MÉTHODE
    DossierMedicalResponse consulterMonDossier(Long patientId);
}