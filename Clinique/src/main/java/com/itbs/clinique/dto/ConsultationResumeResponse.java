package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;

@Data
@Builder
public class ConsultationResumeResponse {
    private Long id;
    private Date date;
    private String medecinNom;
    private String specialite;
    private String diagnostic;
}