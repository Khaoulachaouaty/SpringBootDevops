package com.itbs.clinique.services;

import java.util.List;
import java.util.Map;

import com.itbs.clinique.dto.MedecinResponse;

public interface MedecinService {
    List<MedecinResponse> getAllMedecins();
    MedecinResponse getMedecinById(Long id);
    List<MedecinResponse> getMedecinsBySpecialite(String specialite);
    // NOUVEAUX
    Map<String, Object> getMedecinDetails(Long id);
    void deleteMedecin(Long id);
    // SUPPRIMÉ : findById (utilisez getMedecinById ou repository directement)
}