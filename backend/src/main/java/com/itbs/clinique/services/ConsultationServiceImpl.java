package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.entities.*;
import com.itbs.clinique.repositories.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConsultationServiceImpl implements ConsultationService {
    
    private static final Logger logger = LoggerFactory.getLogger(ConsultationServiceImpl.class);
    
    private final ConsultationRepository consultationRepository;
    private final RendezVousRepository rendezVousRepository;
    private final NotificationService notificationService;
    private final DossierMedicalService dossierMedicalService;

    public ConsultationServiceImpl(ConsultationRepository consultationRepository,
                                    RendezVousRepository rendezVousRepository,
                                    NotificationService notificationService,
                                    DossierMedicalService dossierMedicalService) {
        this.consultationRepository = consultationRepository;
        this.rendezVousRepository = rendezVousRepository;
        this.notificationService = notificationService;
        this.dossierMedicalService = dossierMedicalService;
    }

    @Override
    public ConsultationResponse createConsultation(ConsultationRequest request) {
        logger.info("📝 Création consultation pour RDV: {}", request.getRendezVousId());
        
        RendezVous rdv = rendezVousRepository.findById(request.getRendezVousId())
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        // Vérifier si consultation existe déjà
        consultationRepository.findByRendezVousId(request.getRendezVousId())
                .ifPresent(c -> {
                    throw new RuntimeException("Une consultation existe déjà pour ce rendez-vous");
                });
        
        Consultation consultation = new Consultation();
        consultation.setRendezVous(rdv);
        // ❌ SUPPRIMÉ: consultation.setDateConsultation(new Date());
        consultation.setDiagnostic(request.getDiagnostic());
        consultation.setOrdonnance(request.getOrdonnance());
        consultation.setTraitement(request.getTraitement());
        consultation.setNotes(request.getNotes());
        consultation.setPrixConsultation(request.getPrixConsultation());
        consultation.setMontantMedicaments(request.getMontantMedicaments());
        consultation.calculerTotal();
        consultation.setStatutPaiement("EN_ATTENTE");
        
        Consultation saved = consultationRepository.save(consultation);
        
        // ✅ Maintenant on utilise le service pour mettre à jour le dossier
        dossierMedicalService.mettreAJourDossierApresConsultation(saved);
        
        // Mettre à jour statut RDV
        rdv.setStatut("TERMINE");
        rendezVousRepository.save(rdv);
        
        // Notification de facture au patient
        notificationService.notifierNouvelleFacture(saved);
        
        logger.info("✅ Consultation créée: id={}, montant={}", saved.getId(), saved.getMontantTotal());
        
        return mapToResponse(saved);
    }

    @Override
    public ConsultationResponse getConsultationById(Long id) {
        Consultation c = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
        return mapToResponse(c);
    }

    @Override
    public ConsultationResponse getConsultationByRendezVous(Long rendezVousId) {
        Consultation c = consultationRepository.findByRendezVousId(rendezVousId)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée pour ce rendez-vous"));
        return mapToResponse(c);
    }

    @Override
    public List<ConsultationResponse> getConsultationsByMedecin(Long medecinId) {
        return consultationRepository.findByRendezVousMedecinIdOrderByRendezVousDateDesc(medecinId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ConsultationResponse> getConsultationsByPatient(Long patientId) {
        return consultationRepository.findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FactureResponse genererFacture(Long consultationId) {
        Consultation c = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
        return mapToFactureResponse(c);
    }

    @Override
    public List<FactureResponse> getFacturesByPatient(Long patientId) {
        return consultationRepository.findByRendezVousPatientIdOrderByRendezVousDateDesc(patientId)
                .stream()
                .map(this::mapToFactureResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FactureResponse updateStatutPaiement(Long consultationId, String statut) {
        List<String> statutsValides = List.of("EN_ATTENTE", "PAYE", "ANNULE");
        if (!statutsValides.contains(statut)) {
            throw new RuntimeException("Statut de paiement invalide");
        }
        
        Consultation c = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
        
        c.setStatutPaiement(statut);
        Consultation saved = consultationRepository.save(c);
        
        // Notification de confirmation de paiement
        if ("PAYE".equals(statut)) {
            notificationService.notifierPaiementRecu(saved);
        }
        
        return mapToFactureResponse(saved);
    }

    @Override
    public double calculerRevenusMedecin(Long medecinId) {
        Double revenus = consultationRepository.calculerRevenusMedecin(medecinId);
        return revenus != null ? revenus : 0.0;
    }

    @Override
    public FactureResponse genererFacturePDF(Long consultationId) {
        Consultation c = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
        
        if (!"PAYE".equals(c.getStatutPaiement())) {
            throw new RuntimeException("La facture PDF n'est disponible qu'après paiement");
        }
        
        FactureResponse facture = mapToFactureResponse(c);
        logger.info("📄 Génération PDF facture {} pour {}", 
                   facture.getNumeroFacture(), 
                   facture.getPatientNomComplet());
        
        return facture;
    }

    @Override
    public Map<String, Object> getStatistiquesFacturation(Long medecinId, Date debut, Date fin) {
        List<Consultation> consultations = consultationRepository.findByMedecinAndPeriode(medecinId, debut, fin);
        
        double totalPaye = consultations.stream()
                .filter(c -> "PAYE".equals(c.getStatutPaiement()))
                .mapToDouble(Consultation::getMontantTotal)
                .sum();
        
        double totalEnAttente = consultations.stream()
                .filter(c -> "EN_ATTENTE".equals(c.getStatutPaiement()))
                .mapToDouble(Consultation::getMontantTotal)
                .sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConsultations", consultations.size());
        stats.put("montantTotalPaye", totalPaye);
        stats.put("montantTotalEnAttente", totalEnAttente);
        stats.put("nombrePayes", consultations.stream().filter(c -> "PAYE".equals(c.getStatutPaiement())).count());
        stats.put("nombreEnAttente", consultations.stream().filter(c -> "EN_ATTENTE".equals(c.getStatutPaiement())).count());
        
        return stats;
    }

    // ✅ MÉTHODE CORRIGÉE : on utilise rdv.getDate() au lieu de c.getDateConsultation()
    private ConsultationResponse mapToResponse(Consultation c) {
        RendezVous rdv = c.getRendezVous();
        Patient p = rdv.getPatient();
        Medecin m = rdv.getMedecin();
        
        return ConsultationResponse.builder()
                .id(c.getId())
                .dateConsultation(rdv.getDate())  // ✅ CORRIGÉ
                .diagnostic(c.getDiagnostic())
                .ordonnance(c.getOrdonnance())
                .traitement(c.getTraitement())
                .notes(c.getNotes())
                .prixConsultation(c.getPrixConsultation())
                .montantMedicaments(c.getMontantMedicaments())
                .montantTotal(c.getMontantTotal())
                .statutPaiement(c.getStatutPaiement())
                .rendezVousId(rdv.getId())
                .dateRendezVous(rdv.getDate())
                .heureRendezVous(rdv.getHeure())
                .patientId(p.getId())
                .patientNom(p.getNom())
                .patientPrenom(p.getPrenom())
                .patientEmail(p.getEmail())
                .medecinId(m.getId())
                .medecinNom(m.getNom())
                .medecinPrenom(m.getPrenom())
                .medecinSpecialite(m.getSpecialite())
                .build();
    }

    // ✅ MÉTHODE CORRIGÉE : on utilise rdv.getDate() au lieu de c.getDateConsultation()
    private FactureResponse mapToFactureResponse(Consultation c) {
        RendezVous rdv = c.getRendezVous();
        Patient p = rdv.getPatient();
        Medecin m = rdv.getMedecin();
        
        return FactureResponse.builder()
                .consultationId(c.getId())
                .numeroFacture(FactureResponse.genererNumero(c.getId()))
                .dateFacture(rdv.getDate())  // ✅ CORRIGÉ
                .patientNomComplet(p.getNomComplet())
                .patientEmail(p.getEmail())
                .patientTel(p.getTel())
                .medecinNomComplet(m.getNomComplet())
                .medecinSpecialite(m.getSpecialite())
                .motifConsultation(rdv.getMotif())
                .dateRendezVous(rdv.getDate())
                .prixConsultation(c.getPrixConsultation())
                .montantMedicaments(c.getMontantMedicaments())
                .montantTotal(c.getMontantTotal())
                .statutPaiement(c.getStatutPaiement())
                .build();
    }
}