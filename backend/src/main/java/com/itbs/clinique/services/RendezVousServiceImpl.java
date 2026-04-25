package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.entities.*;
import com.itbs.clinique.repositories.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RendezVousServiceImpl implements RendezVousService {
    
    private static final Logger logger = LoggerFactory.getLogger(RendezVousServiceImpl.class);
    
    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final NotificationService notificationService;

    private static final int DUREE_RDV_MINUTES = 30;
    
    public RendezVousServiceImpl(RendezVousRepository rendezVousRepository,
                                  PatientRepository patientRepository,
                                  MedecinRepository medecinRepository,
                                  NotificationService notificationService) {
        this.rendezVousRepository = rendezVousRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.notificationService = notificationService;
    }
    
    // ========== CONVERSIONS ==========
    
    private Long getMedecinIdFromUserId(Long userId) {
        logger.info("🔍 Conversion userId {} → medecinId", userId);
        Optional<Medecin> medecinOpt = medecinRepository.findByUserUserId(userId);
        if (medecinOpt.isPresent()) {
            Long medecinId = medecinOpt.get().getId();
            logger.info("✅ Trouvé: medecinId = {}", medecinId);
            return medecinId;
        } else {
            logger.warn("⚠️ Aucun médecin trouvé pour userId {}, on utilise l'ID tel quel", userId);
            return userId;
        }
    }
    
    private Long getPatientIdFromUserId(Long userId) {
        logger.info("🔍 Conversion userId {} → patientId", userId);
        Optional<Patient> patientOpt = patientRepository.findByUserUserId(userId);
        if (patientOpt.isPresent()) {
            Long patientId = patientOpt.get().getId();
            logger.info("✅ Trouvé: patientId = {}", patientId);
            return patientId;
        } else {
            logger.warn("⚠️ Aucun patient trouvé pour userId {}, on utilise l'ID tel quel", userId);
            return userId;
        }
    }
    
    // ========== PATIENT ==========
    
    @Override
    public RendezVousResponse createRendezVous(RendezVousRequest request) {
        logger.info("📅 Création RDV: patientUserId={}, medecinUserId={}", 
                   request.getPatientId(), request.getMedecinId());
        
        Long vraiPatientId = getPatientIdFromUserId(request.getPatientId());
        Long vraiMedecinId = getMedecinIdFromUserId(request.getMedecinId());

        Patient patient = patientRepository.findById(vraiPatientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé: " + vraiPatientId));
        
        Medecin medecin = medecinRepository.findById(vraiMedecinId)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé: " + vraiMedecinId));
        
        // Validations
        if (!isFormatHeureValide(request.getHeure())) {
            throw new RuntimeException("Format d'heure invalide. Utilisez HH:mm");
        }
        
        if (!isCreneauValide(request.getHeure())) {
            throw new RuntimeException("Les RDV doivent être à heure fixe ou demi-heure");
        }
        
        String jourSemaine = getJourSemaine(request.getDate());
        if (!isJourOuvre(jourSemaine)) {
            throw new RuntimeException("Le médecin ne travaille pas le " + jourSemaine);
        }
        
        String heureFin = ajouterMinutes(request.getHeure(), DUREE_RDV_MINUTES);
        if (!isDansPlageHoraireStandard(request.getHeure(), heureFin, jourSemaine)) {
            throw new RuntimeException("Horaire hors plages standard");
        }
        
        if (isCreneauOccupe(medecin.getId(), request.getDate(), request.getHeure())) {
            throw new RuntimeException("Ce créneau est déjà réservé");
        }
        
        RendezVous rdv = new RendezVous();
        rdv.setPatient(patient);
        rdv.setMedecin(medecin);
        rdv.setDate(request.getDate());
        rdv.setHeure(request.getHeure());
        rdv.setMotif(request.getMotif());
        rdv.setStatut("EN_ATTENTE");
        
        RendezVous saved = rendezVousRepository.save(rdv);
        
        // 🔥 Notification au MÉDECIN (nouveau RDV reçu)
        notificationService.notifierNouveauRendezVousMedecin(saved);
        
        // 🔥 Notification au PATIENT (confirmation de la demande)
        notificationService.notifierDemandeRendezVousRecue(saved);
        
        logger.info("✅ RDV créé: id={}, statut={}", saved.getId(), saved.getStatut());
        
        return mapToResponse(saved);
    }
    
    @Override
    public List<RendezVousResponse> getRendezVousByPatient(Long patientUserId) {
        logger.info("🔍 RDV pour patientUserId={}", patientUserId);
        Long vraiPatientId = getPatientIdFromUserId(patientUserId);
        
        List<RendezVous> rdvs = rendezVousRepository.findByPatientId(vraiPatientId);
        logger.info("📊 {} RDV trouvés", rdvs.size());
        
        return rdvs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public void cancelRendezVous(Long rendezVousId, Long patientUserId) {
        logger.info("❌ Annulation RDV {} par patientUserId={}", rendezVousId, patientUserId);
        
        // 🔥 CONVERTIR userId → patientId
        Long vraiPatientId = getPatientIdFromUserId(patientUserId);
        
        RendezVous rdv = rendezVousRepository.findById(rendezVousId)
                .orElseThrow(() -> new RuntimeException("RDV non trouvé"));
        
        // 🔥 VÉRIFICATION : Le patient est-il bien le propriétaire ?
        if (!rdv.getPatient().getId().equals(vraiPatientId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler ce rendez-vous");
        }
        
        // 🔥 VÉRIFICATION CRITIQUE : Le médecin n'a pas encore répondu (EN_ATTENTE uniquement)
        if (!"EN_ATTENTE".equals(rdv.getStatut())) {
            String statutFr = switch (rdv.getStatut()) {
                case "CONFIRME" -> "confirmé";
                case "TERMINE" -> "terminé";
                case "ANNULE" -> "déjà annulé";
                default -> rdv.getStatut();
            };
            throw new RuntimeException("Impossible d'annuler : ce rendez-vous est " + statutFr + 
                ". Un rendez-vous ne peut être annulé par le patient que s'il est en attente de confirmation.");
        }
        
        // 🔥 Annulation autorisée
        rdv.setStatut("ANNULE");
        rendezVousRepository.save(rdv);
        
        // 🔥 Notification au MÉDECIN (car c'est le patient qui annule)
        notificationService.notifierAnnulationRdvParPatient(rdv);
        
        logger.info("✅ RDV {} annulé par patient {}", rendezVousId, vraiPatientId);
    }
    
    // ========== MEDECIN ==========
    
    @Override
    public List<RendezVousResponse> getRendezVousByMedecin(Long medecinUserId) {
        logger.info("🔍 RDV pour medecinUserId={}", medecinUserId);
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        
        List<RendezVous> rdvs = rendezVousRepository.findByMedecinId(vraiMedecinId);
        logger.info("📊 {} RDV trouvés", rdvs.size());
        
        return rdvs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    
	@Override
	public RendezVousResponse updateStatus(Long rendezVousId, String status, Long medecinUserId) {
	    Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
	    
	    RendezVous rdv = rendezVousRepository.findById(rendezVousId)
	            .orElseThrow(() -> new RuntimeException("RDV non trouvé"));
	    
	    if (!rdv.getMedecin().getId().equals(vraiMedecinId)) {
	        throw new RuntimeException("Non autorisé");
	    }
	    
	    if ("CONFIRME".equals(status)) {
	        notificationService.notifierConfirmationRdv(rdv);
	    } else if ("ANNULE".equals(status)) {
	        notificationService.notifierAnnulationRdvParMedecin(rdv, "Annulé");
	    }
	    
	    rdv.setStatut(status);
	    return mapToResponse(rendezVousRepository.save(rdv));
	}

    private boolean isAujourdhui(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(date).equals(sdf.format(new Date()));
    }
    
    @Override
    public List<RendezVousResponse> getRendezVousDuJour(Long medecinUserId, Date date) {
        logger.info("📋 RDV du jour pour medecinUserId={}, date={}", medecinUserId, date);
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        
        List<RendezVous> tousRdvs = rendezVousRepository.findByMedecinId(vraiMedecinId);
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = sdf.format(date);
        
        List<RendezVous> rdvs = tousRdvs.stream()
                .filter(rdv -> {
                    String rdvDateStr = sdf.format(rdv.getDate());
                    return rdvDateStr.equals(dateStr);
                })
                .collect(Collectors.toList());
        
        logger.info("📊 {} RDV pour le {}", rdvs.size(), dateStr);
        return rdvs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public List<CalendarEventResponse> getCalendarEvents(Long medecinUserId, Date start, Date end) {
        logger.info("📆 Calendrier pour medecinUserId={}, {} au {}", medecinUserId, start, end);
        
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        List<RendezVous> tousRdvs = rendezVousRepository.findByMedecinId(vraiMedecinId);
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        String startStr = sdf.format(start);
        String endStr = sdf.format(end);
        
        List<RendezVous> rdvs = tousRdvs.stream()
                .filter(rdv -> {
                    String rdvDateStr = sdf.format(rdv.getDate());
                    boolean dansIntervalle = rdvDateStr.compareTo(startStr) >= 0 
                                          && rdvDateStr.compareTo(endStr) <= 0;
                    return dansIntervalle && !"ANNULE".equals(rdv.getStatut());
                })
                .collect(Collectors.toList());
        
        return rdvs.stream()
                .map(rdv -> {
                    String color = switch (rdv.getStatut()) {
                        case "CONFIRME" -> "#28a745";
                        case "EN_ATTENTE" -> "#ffc107";
                        case "TERMINE" -> "#6c757d";
                        default -> "#007bff";
                    };
                    
                    String dateStr = sdf.format(rdv.getDate());
                    String startTime = dateStr + "T" + rdv.getHeure() + ":00";
                    String endTime = calculateEndTime(dateStr, rdv.getHeure());
                    
                    return CalendarEventResponse.builder()
                            .id(rdv.getId())
                            .title(rdv.getPatient().getNomComplet() + " - " + rdv.getMotif())
                            .start(startTime)
                            .end(endTime)
                            .status(rdv.getStatut())
                            .color(color)
                            .patientId(rdv.getPatient().getId())
                            .patientNom(rdv.getPatient().getNomComplet())
                            .motif(rdv.getMotif())
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    // ========== CRÉNEAUX ==========
    
    @Override
    public List<String> getCreneauxDisponibles(Long medecinUserId, Date date) {
        logger.info("🔍 Créneaux disponibles pour medecinUserId={}, date={}", medecinUserId, date);
        
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        String jourSemaine = getJourSemaine(date);
        
        if (!isJourOuvre(jourSemaine)) {
            logger.info("🏖️ Jour non ouvré: {}", jourSemaine);
            return Collections.emptyList();
        }
        
        List<String> tousCreneaux = genererCreneauxStandards(jourSemaine);
        List<String> occupes = getCreneauxOccupes(medecinUserId, date);
        
        List<String> disponibles = tousCreneaux.stream()
                .filter(c -> !occupes.contains(c))
                .sorted()
                .collect(Collectors.toList());
        
        logger.info("✅ {} créneaux disponibles sur {}", disponibles.size(), tousCreneaux.size());
        return disponibles;
    }
    
    @Override
    public List<String> getCreneauxOccupes(Long medecinUserId, Date date) {
        logger.info("🔴 Créneaux occupés pour medecinUserId={}, date={}", medecinUserId, date);
        
        Long vraiMedecinId = getMedecinIdFromUserId(medecinUserId);
        List<RendezVous> rdvs = rendezVousRepository.findByMedecinId(vraiMedecinId);
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = sdf.format(date);
        
        List<String> occupes = rdvs.stream()
                .filter(rdv -> {
                    String rdvDateStr = sdf.format(rdv.getDate());
                    return rdvDateStr.equals(dateStr) && !"ANNULE".equals(rdv.getStatut());
                })
                .map(RendezVous::getHeure)
                .collect(Collectors.toList());
        
        logger.info("🔴 {} créneaux occupés: {}", occupes.size(), occupes);
        return occupes;
    }
    
    // ========== ADMIN ==========
    
    @Override
    public List<RendezVousResponse> getAllRendezVous() {
        return rendezVousRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public List<RendezVousResponse> filterByPatient(Long patientId) {
        return getRendezVousByPatient(patientId);
    }
    
    @Override
    public List<RendezVousResponse> filterBySpecialite(String specialite) {
        return rendezVousRepository.findByMedecinSpecialite(specialite).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public List<RendezVousResponse> filterByMedecinAndDate(Long medecinId, Date date) {
        return getRendezVousDuJour(medecinId, date);
    }
    
    // ========== UTILITAIRES ==========
    
    private boolean isJourOuvre(String jourSemaine) {
        return switch (jourSemaine) {
            case "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI" -> true;
            case "DIMANCHE" -> false;
            default -> false;
        };
    }
    
    private boolean isDansPlageHoraireStandard(String heureDebut, String heureFin, String jourSemaine) {
        return switch (jourSemaine) {
            case "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI" -> {
                boolean matin = heureDebut.compareTo("08:00") >= 0 && heureFin.compareTo("12:00") <= 0;
                boolean aprem = heureDebut.compareTo("14:00") >= 0 && heureFin.compareTo("18:00") <= 0;
                yield matin || aprem;
            }
            case "SAMEDI" -> heureDebut.compareTo("08:00") >= 0 && heureFin.compareTo("12:00") <= 0;
            default -> false;
        };
    }
    
    private List<String> genererCreneauxStandards(String jourSemaine) {
        List<String> creneaux = new ArrayList<>();
        
        switch (jourSemaine) {
            case "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI" -> {
                creneaux.addAll(genererCreneauxPlage("08:00", "12:00"));
                creneaux.addAll(genererCreneauxPlage("14:00", "18:00"));
            }
            case "SAMEDI" -> creneaux.addAll(genererCreneauxPlage("08:00", "12:00"));
        }
        
        return creneaux;
    }
    
    private List<String> genererCreneauxPlage(String debut, String fin) {
        List<String> creneaux = new ArrayList<>();
        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm");
        
        try {
            Calendar cal = Calendar.getInstance();
            cal.setTime(sdf.parse(debut));
            Date heureFin = sdf.parse(fin);
            
            while (cal.getTime().before(heureFin)) {
                String creneau = sdf.format(cal.getTime());
                String creneauFinStr = ajouterMinutes(creneau, DUREE_RDV_MINUTES);
                
                if (creneauFinStr.compareTo(fin) <= 0) {
                    creneaux.add(creneau);
                }
                cal.add(Calendar.MINUTE, 30);
            }
        } catch (ParseException e) {
            logger.error("Erreur génération créneaux: {}", e.getMessage());
        }
        
        return creneaux;
    }
    
    private boolean isCreneauOccupe(Long medecinId, Date date, String heure) {
        return rendezVousRepository.isCreneauOccupe(medecinId, date, heure);
    }
    
    private boolean isFormatHeureValide(String heure) {
        return heure != null && heure.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$");
    }
    
    private boolean isCreneauValide(String heure) {
        try {
            String[] parts = heure.split(":");
            int minutes = Integer.parseInt(parts[1]);
            return minutes == 0 || minutes == 30;
        } catch (Exception e) {
            return false;
        }
    }
    
    private String ajouterMinutes(String heure, int minutes) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm");
            Date date = sdf.parse(heure);
            Calendar cal = Calendar.getInstance();
            cal.setTime(date);
            cal.add(Calendar.MINUTE, minutes);
            return sdf.format(cal.getTime());
        } catch (ParseException e) {
            return heure;
        }
    }
    
    private String getJourSemaine(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("EEEE", Locale.FRENCH);
        return normaliserJour(sdf.format(date));
    }
    
    private String normaliserJour(String jour) {
        if (jour == null) return null;
        return jour.toUpperCase().trim().replace("É", "E").replace("È", "E");
    }
    
    private String calculateEndTime(String dateStr, String heure) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
            Date start = sdf.parse(dateStr + "T" + heure + ":00");
            Calendar cal = Calendar.getInstance();
            cal.setTime(start);
            cal.add(Calendar.MINUTE, DUREE_RDV_MINUTES);
            return sdf.format(cal.getTime());
        } catch (ParseException e) {
            return dateStr + "T" + heure + ":30:00";
        }
    }
    
    private RendezVousResponse mapToResponse(RendezVous rdv) {
        Patient p = rdv.getPatient();
        Medecin m = rdv.getMedecin();
        
        return RendezVousResponse.builder()
                .id(rdv.getId())
                .date(rdv.getDate())
                .heure(rdv.getHeure())
                .motif(rdv.getMotif())
                .statut(rdv.getStatut())
                .patientId(p.getId())
                .patientNom(p.getNom())
                .patientPrenom(p.getPrenom())
                .patientEmail(p.getEmail())
                .patientTel(p.getTel())
                .medecinId(m.getId())
                .medecinNom(m.getNom())
                .medecinPrenom(m.getPrenom())
                .medecinSpecialite(m.getSpecialite())
                .build();
    }
    
    public RendezVousResponse modifierRendezVous(Long rendezVousId, RendezVousRequest request, Long patientUserId) {
        logger.info("✏️ Modification RDV {} par patientUserId={}", rendezVousId, patientUserId);
        
        Long vraiPatientId = getPatientIdFromUserId(patientUserId);
        logger.info("Vrai patient ID: {}", vraiPatientId);

        RendezVous rdv = rendezVousRepository.findById(rendezVousId)
                .orElseThrow(() -> new RuntimeException("RDV non trouvé"));
        logger.info("RDV trouvé: id={}, date={}, heure={}, statut={}", 
            rdv.getId(), rdv.getDate(), rdv.getHeure(), rdv.getStatut());

        // Vérification propriétaire
        if (!rdv.getPatient().getId().equals(vraiPatientId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce rendez-vous");
        }

        // Vérification statut : uniquement si EN_ATTENTE
        if (!"EN_ATTENTE".equals(rdv.getStatut())) {
            throw new RuntimeException("Impossible de modifier : le médecin a déjà " + 
                ("CONFIRME".equals(rdv.getStatut()) ? "accepté" : "traité") + " ce rendez-vous");
        }

        // 🔥 CORRECTION ICI : Vérifier si le créneau est OCCUPÉ (pas libre!)
        // Si on garde la même date/heure, c'est OK (c'est notre propre RDV)
        boolean memeCreneau = rdv.getDate().equals(request.getDate()) 
                           && rdv.getHeure().equals(request.getHeure());
        
        if (!memeCreneau && isCreneauOccupe(rdv.getMedecin().getId(), request.getDate(), request.getHeure())) {
            throw new RuntimeException("Le nouveau créneau n'est pas disponible");
        }

        // Mise à jour
        rdv.setDate(request.getDate());
        rdv.setHeure(request.getHeure());
        rdv.setMotif(request.getMotif());
        RendezVous saved = rendezVousRepository.save(rdv);
        logger.info("RDV modifié et sauvegardé: id={}", saved.getId());

        // Notification au médecin
        notificationService.notifierModificationRdvParPatient(saved);

        return mapToResponse(saved);
    }

    
    
}