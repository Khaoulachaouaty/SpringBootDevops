package com.itbs.clinique.services;

import com.itbs.clinique.dto.MedecinResponse;
import com.itbs.clinique.entities.Medecin;
import com.itbs.clinique.entities.User;
import com.itbs.clinique.repositories.MedecinRepository;
import com.itbs.clinique.repositories.RendezVousRepository;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MedecinServiceImpl implements MedecinService {
    
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;

    public MedecinServiceImpl(MedecinRepository medecinRepository,
                              RendezVousRepository rendezVousRepository) {
        this.medecinRepository = medecinRepository;
        this.rendezVousRepository = rendezVousRepository;
    }

    @Override
    public List<MedecinResponse> getAllMedecins() {
        return medecinRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MedecinResponse getMedecinById(Long id) {
        Medecin medecin = medecinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
        return mapToResponse(medecin);
    }

    @Override
    public List<MedecinResponse> getMedecinsBySpecialite(String specialite) {
        return medecinRepository.findBySpecialite(specialite).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getMedecinDetails(Long id) {
        Medecin medecin = medecinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
        
        int nombrePatients = rendezVousRepository.countDistinctPatientsByMedecinId(id);
        int rendezVousTotal = rendezVousRepository.countByMedecinId(id);
        
        Map<String, Object> details = new HashMap<>();
        details.put("medecin", mapToResponse(medecin));
        details.put("nombrePatients", nombrePatients);
        details.put("rendezVousTotal", rendezVousTotal);
        
        return details;
    }

    @Override
    public void deleteMedecin(Long id) {
        Medecin medecin = medecinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
        medecinRepository.delete(medecin);
    }

    // SUPPRIMÉ : findById (utilisez medecinRepository.findById() directement si besoin)

    private MedecinResponse mapToResponse(Medecin medecin) {
        User user = medecin.getUser();
        return MedecinResponse.builder()
                .id(medecin.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getUsername())
                .tel(user.getTel())
                .specialite(medecin.getSpecialite())
                .build();
    }
}