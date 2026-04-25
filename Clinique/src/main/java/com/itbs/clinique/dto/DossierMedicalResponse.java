package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
@Builder
public class DossierMedicalResponse {
    private Long patientId;
    private String patientNomComplet;
    private Date dateNaissance;
    private String dossierMedical;
    private List<ConsultationResumeResponse> historiqueConsultations;
}