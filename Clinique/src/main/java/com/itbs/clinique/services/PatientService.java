package com.itbs.clinique.services;

import java.util.List;

import com.itbs.clinique.dto.PatientResponse;

public interface PatientService {
    List<PatientResponse> getAllPatients();
    PatientResponse getPatientById(Long id);
}