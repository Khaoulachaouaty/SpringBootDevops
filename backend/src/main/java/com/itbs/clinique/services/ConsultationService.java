package com.itbs.clinique.services;

import java.util.Date;
import java.util.List;
import java.util.Map;

import com.itbs.clinique.dto.*;

public interface ConsultationService {
    
    // CRUD Consultation
    ConsultationResponse createConsultation(ConsultationRequest request);
    ConsultationResponse getConsultationById(Long id);
    ConsultationResponse getConsultationByRendezVous(Long rendezVousId);
    List<ConsultationResponse> getConsultationsByMedecin(Long medecinId);
    List<ConsultationResponse> getConsultationsByPatient(Long patientId);
    
    // Facturation
    FactureResponse genererFacture(Long consultationId);
    FactureResponse genererFacturePDF(Long consultationId); // 🔥 AJOUTÉ
    List<FactureResponse> getFacturesByPatient(Long patientId);
    FactureResponse updateStatutPaiement(Long consultationId, String statut);
    
    // Statistiques
    double calculerRevenusMedecin(Long medecinId);
    Map<String, Object> getStatistiquesFacturation(Long medecinId, Date debut, Date fin); // 🔥 AJOUTÉ
}