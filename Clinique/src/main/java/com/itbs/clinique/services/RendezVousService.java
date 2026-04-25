package com.itbs.clinique.services;

import java.util.Date;
import java.util.List;

import com.itbs.clinique.dto.*;

public interface RendezVousService {
    
    // ========== PATIENT ==========
    RendezVousResponse createRendezVous(RendezVousRequest request);
    RendezVousResponse modifierRendezVous(Long rendezVousId, RendezVousRequest request, Long patientUserId); // 🔥 AJOUTÉ
    List<RendezVousResponse> getRendezVousByPatient(Long patientUserId);
    void cancelRendezVous(Long rendezVousId, Long patientUserId);
    
    // ========== MEDECIN ==========
    List<RendezVousResponse> getRendezVousByMedecin(Long medecinUserId);
    List<RendezVousResponse> getRendezVousDuJour(Long medecinUserId, Date date);
    List<CalendarEventResponse> getCalendarEvents(Long medecinUserId, Date start, Date end);
    
    // ========== CRÉNEAUX ==========
    List<String> getCreneauxDisponibles(Long medecinUserId, Date date);
    List<String> getCreneauxOccupes(Long medecinUserId, Date date);
    
    // ========== ADMIN ==========
    List<RendezVousResponse> getAllRendezVous();
    List<RendezVousResponse> filterByPatient(Long patientId);
    List<RendezVousResponse> filterBySpecialite(String specialite);
    List<RendezVousResponse> filterByMedecinAndDate(Long medecinId, Date date);
    
    RendezVousResponse updateStatus(Long rendezVousId, String status, Long medecinUserId);}