package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;

public interface AuthService {
    AuthResponse registerPatient(RegisterPatientRequest request);
    AuthResponse createMedecin(CreateMedecinRequest request);
    AuthResponse login(LoginRequest request);
}