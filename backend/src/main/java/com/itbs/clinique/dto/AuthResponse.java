package com.itbs.clinique.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private boolean success;
    private Long userId;
    private String email;
    private String nomComplet;
    private List<String> roles;
    
    private Long patientId;  
    private Long medecinId;
}