package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class PatientResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String tel;
    private Date dateNaissance;
    private String dossierMedical;
}