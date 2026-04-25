package com.itbs.clinique.services;

import com.itbs.clinique.dto.PatientResponse;
import com.itbs.clinique.entities.Patient;
import com.itbs.clinique.entities.User;
import com.itbs.clinique.repositories.PatientRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientServiceImpl implements PatientService {
    
    private final PatientRepository patientRepository;

    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        return mapToResponse(patient);
    }

    private PatientResponse mapToResponse(Patient patient) {
        User user = patient.getUser();
        return PatientResponse.builder()
                .id(patient.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getUsername())
                .tel(user.getTel())
                .dateNaissance(patient.getDateNaissance())
                .dossierMedical(patient.getDossierMedical())
                .build();
    }
}