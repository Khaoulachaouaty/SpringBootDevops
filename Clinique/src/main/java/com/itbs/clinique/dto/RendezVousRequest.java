package com.itbs.clinique.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Date;

@Data
public class RendezVousRequest {
    
    @NotNull(message = "L'ID du patient est obligatoire")
    private Long patientId;
    
    @NotNull(message = "L'ID du médecin est obligatoire")
    private Long medecinId;
    
    @NotNull(message = "La date est obligatoire")
    private Date date;
    
    @NotBlank(message = "L'heure est obligatoire")
    private String heure;
    
    private String motif;
}


