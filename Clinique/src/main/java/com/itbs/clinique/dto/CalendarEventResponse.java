package com.itbs.clinique.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalendarEventResponse {
    private Long id;
    private String title;
    private String start; // format ISO 8601
    private String end;   // format ISO 8601
    private String status;
    private String color;
    private Long patientId;
    private String patientNom;
    private String motif;
}