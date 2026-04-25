package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.entities.*;
import com.itbs.clinique.repositories.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);
    
    private final NotificationRepository notificationRepository;
    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    
    // 🔥 NOUVEAU : Injection du service WebSocket
    private final WebSocketNotificationService webSocketService;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                    RendezVousRepository rendezVousRepository,
                                    PatientRepository patientRepository,
                                    MedecinRepository medecinRepository,
                                    WebSocketNotificationService webSocketService) {  // 🔥 AJOUTÉ
        this.notificationRepository = notificationRepository;
        this.rendezVousRepository = rendezVousRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.webSocketService = webSocketService;  // 🔥 AJOUTÉ
    }

    // ========== MÉTHODE PRIVÉE POUR CRÉER ET ENVOYER ==========
    
    /**
     * Crée une notification en base de données ET l'envoie en temps réel via WebSocket
     */
    private NotificationResponse createAndSendNotification(NotificationRequest request, 
                                                            Long destinataireId, 
                                                            String destinataireType) {
        // 1. Sauvegarder en base de données
        NotificationResponse saved = createNotification(request);
        
        // 2. Envoyer via WebSocket
        if ("PATIENT".equals(destinataireType)) {
            webSocketService.envoyerNotificationPatient(destinataireId, saved);
        } else if ("MEDECIN".equals(destinataireType)) {
            webSocketService.envoyerNotificationMedecin(destinataireId, saved);
        }
        
        return saved;
    }

    // ========== NOTIFICATIONS AU MÉDECIN ==========

    @Override
    public void notifierNouveauRendezVousMedecin(RendezVous rendezVous) {
        String message = String.format(
            "📅 Nouveau rendez-vous: %s le %s à %s. Motif: %s",
            rendezVous.getPatient().getNomComplet(),
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure(),
            rendezVous.getMotif()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setMedecinId(rendezVous.getMedecin().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("NOUVEAU_RDV");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getMedecin().getId(), "MEDECIN");
        
        logger.info("📧 [EMAIL AU MÉDECIN] À {}: {}", 
            rendezVous.getMedecin().getEmail(), message);
    }

    @Override
    public void notifierAnnulationRdvParPatient(RendezVous rendezVous) {
        String message = String.format(
            "❌ Annulation: Le patient %s a annulé son rendez-vous du %s à %s",
            rendezVous.getPatient().getNomComplet(),
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setMedecinId(rendezVous.getMedecin().getId());
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("ANNULATION_PAR_PATIENT");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getMedecin().getId(), "MEDECIN");
        
        logger.info("📧 [EMAIL AU MÉDECIN] À {}: {}", 
            rendezVous.getMedecin().getEmail(), message);
    }

    @Override
    public void notifierModificationRdvParPatient(RendezVous rendezVous) {
        String message = String.format(
            "📝 Modification: Le patient %s a modifié son rendez-vous au %s à %s",
            rendezVous.getPatient().getNomComplet(),
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setMedecinId(rendezVous.getMedecin().getId());
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("MODIFICATION_PAR_PATIENT");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getMedecin().getId(), "MEDECIN");
        
        logger.info("📧 [EMAIL AU MÉDECIN] À {}: {}", 
            rendezVous.getMedecin().getEmail(), message);
    }

    // ========== NOTIFICATIONS AU PATIENT ==========

    @Override
    public void notifierConfirmationRdv(RendezVous rendezVous) {
        String message = String.format(
            "✅ Confirmation: Votre rendez-vous avec Dr. %s est confirmé pour le %s à %s.",
            rendezVous.getMedecin().getNomComplet(),
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("CONFIRMATION_RDV");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getPatient().getId(), "PATIENT");
        
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rendezVous.getPatient().getEmail(), message);
    }

    @Override
    public void notifierAnnulationRdvParMedecin(RendezVous rendezVous, String raison) {
        String message = String.format(
            "❌ Annulation: Votre rendez-vous du %s à %s avec Dr. %s a été annulé. Raison: %s",
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure(),
            rendezVous.getMedecin().getNomComplet(),
            raison != null ? raison : "Non spécifiée"
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("ANNULATION_PAR_MEDECIN");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getPatient().getId(), "PATIENT");
        
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rendezVous.getPatient().getEmail(), message);
    }

    @Override
    public void notifierRappelRendezVous(RendezVous rendezVous) {
        String message = String.format(
            "📅 Rappel: Vous avez un rendez-vous demain à %s avec Dr. %s (%s). Motif: %s",
            rendezVous.getHeure(),
            rendezVous.getMedecin().getNomComplet(),
            rendezVous.getMedecin().getSpecialite(),
            rendezVous.getMotif()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("RAPPEL_RDV");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getPatient().getId(), "PATIENT");
        
        // Simulation SMS/Email
        logger.info("📱 [SMS AU PATIENT] À {}: {}", 
            rendezVous.getPatient().getTel(), message);
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rendezVous.getPatient().getEmail(), message);
    }

    @Override
    public void notifierDemandeRendezVousRecue(RendezVous rendezVous) {
        String message = String.format(
            "⏳ Demande envoyée: Votre demande de rendez-vous avec Dr. %s pour le %s à %s est en attente de confirmation.",
            rendezVous.getMedecin().getNomComplet(),
            new SimpleDateFormat("dd/MM/yyyy").format(rendezVous.getDate()),
            rendezVous.getHeure()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rendezVous.getPatient().getId());
        request.setRendezVousId(rendezVous.getId());
        request.setMessage(message);
        request.setType("DEMANDE_EN_ATTENTE");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rendezVous.getPatient().getId(), "PATIENT");
        
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rendezVous.getPatient().getEmail(), message);
    }

    @Override
    public void notifierNouvelleFacture(Consultation consultation) {
        RendezVous rdv = consultation.getRendezVous();
        
        String message = String.format(
            "💳 Nouvelle facture: %.2f DHS pour votre consultation avec Dr. %s. Statut: %s",
            consultation.getMontantTotal(),
            rdv.getMedecin().getNomComplet(),
            consultation.getStatutPaiement()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rdv.getPatient().getId());
        request.setMessage(message);
        request.setType("FACTURE");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rdv.getPatient().getId(), "PATIENT");
        
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rdv.getPatient().getEmail(), message);
    }

    @Override
    public void notifierPaiementRecu(Consultation consultation) {
        RendezVous rdv = consultation.getRendezVous();
        
        String message = String.format(
            "💰 Paiement reçu: Votre paiement de %.2f DHS a été confirmé. Merci!",
            consultation.getMontantTotal()
        );
        
        NotificationRequest request = new NotificationRequest();
        request.setPatientId(rdv.getPatient().getId());
        request.setMessage(message);
        request.setType("PAIEMENT_RECU");
        
        // 🔥 Envoi avec WebSocket
        createAndSendNotification(request, rdv.getPatient().getId(), "PATIENT");
        
        logger.info("📧 [EMAIL AU PATIENT] À {}: {}", 
            rdv.getPatient().getEmail(), message);
    }

    // ========== CRÉATION MANUELLE (SANS WEBSOCKET) ==========

    @Override
    public NotificationResponse createNotification(NotificationRequest request) {
        Notification notif = new Notification();
        notif.setMessage(request.getMessage());
        notif.setDateEnvoi(new Date());
        notif.setType(request.getType());
        notif.setStatut("NON_LUE");
        notif.setDonnees(request.getDonnees());
        
        if (request.getPatientId() != null) {
            Patient p = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
            notif.setPatient(p);
        }
        
        if (request.getMedecinId() != null) {
            Medecin m = medecinRepository.findById(request.getMedecinId())
                    .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
            notif.setMedecin(m);
        }
        
        if (request.getRendezVousId() != null) {
            RendezVous rdv = rendezVousRepository.findById(request.getRendezVousId())
                    .orElseThrow(() -> new RuntimeException("RDV non trouvé"));
            notif.setRendezVous(rdv);
        }
        
        Notification saved = notificationRepository.save(notif);
        logger.info("🔔 Notification créée en BDD: type={}", request.getType());
        
        return mapToResponse(saved);
    }

    // ========== LECTURE ==========

    @Override
    public List<NotificationResponse> getNotificationsByPatient(Long patientId) {
        return notificationRepository.findByPatientIdOrderByDateEnvoiDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> getNotificationsByMedecin(Long medecinId) {
        return notificationRepository.findByMedecinIdOrderByDateEnvoiDesc(medecinId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> getNotificationsNonLues(Long userId, String userType) {
        if ("PATIENT".equals(userType)) {
            return notificationRepository.findByPatientIdAndStatutOrderByDateEnvoiDesc(userId, "NON_LUE")
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else if ("MEDECIN".equals(userType)) {
            return notificationRepository.findByMedecinIdAndStatutOrderByDateEnvoiDesc(userId, "NON_LUE")
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    // ========== ACTIONS ==========

    @Override
    public NotificationResponse marquerCommeLue(Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        
        notif.setStatut("LUE");
        notif.setDateLecture(new Date());
        
        return mapToResponse(notificationRepository.save(notif));
    }

    @Override
    public void marquerToutesCommeLues(Long userId, String userType) {
        List<Notification> nonLues;
        
        if ("PATIENT".equals(userType)) {
            nonLues = notificationRepository.findByPatientIdAndStatutOrderByDateEnvoiDesc(userId, "NON_LUE");
        } else if ("MEDECIN".equals(userType)) {
            nonLues = notificationRepository.findByMedecinIdAndStatutOrderByDateEnvoiDesc(userId, "NON_LUE");
        } else {
            return;
        }
        
        nonLues.forEach(n -> {
            n.setStatut("LUE");
            n.setDateLecture(new Date());
        });
        
        notificationRepository.saveAll(nonLues);
    }

    @Override
    public long getNombreNotificationsNonLues(Long userId, String userType) {
        if ("PATIENT".equals(userType)) {
            return notificationRepository.countByPatientIdAndStatut(userId, "NON_LUE");
        } else if ("MEDECIN".equals(userType)) {
            return notificationRepository.countByMedecinIdAndStatut(userId, "NON_LUE");
        }
        return 0;
    }

    // ========== TÂCHE PLANIFIÉE ==========

    @Override
    @Scheduled(cron = "0 0 18 * * ?") // Tous les jours à 18h
    public void envoyerRappelsAutomatiques() {
        logger.info("🤖 Début envoi rappels automatiques...");
        
        Calendar demain = Calendar.getInstance();
        demain.add(Calendar.DAY_OF_YEAR, 1);
        demain.set(Calendar.HOUR_OF_DAY, 0);
        demain.set(Calendar.MINUTE, 0);
        demain.set(Calendar.SECOND, 0);
        
        Calendar finDemain = (Calendar) demain.clone();
        finDemain.set(Calendar.HOUR_OF_DAY, 23);
        finDemain.set(Calendar.MINUTE, 59);
        
        List<RendezVous> rdvsDemain = rendezVousRepository.findAll().stream()
                .filter(rdv -> {
                    Date dateRdv = rdv.getDate();
                    return dateRdv.after(demain.getTime()) && dateRdv.before(finDemain.getTime())
                            && "CONFIRME".equals(rdv.getStatut());
                })
                .collect(Collectors.toList());
        
        logger.info("📅 {} rendez-vous confirmés trouvés pour demain", rdvsDemain.size());
        
        rdvsDemain.forEach(this::notifierRappelRendezVous);
        
        logger.info("✅ Rappels automatiques envoyés aux patients");
    }

    // ========== MAPPING ==========

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .dateEnvoi(n.getDateEnvoi())
                .dateLecture(n.getDateLecture())
                .type(n.getType())
                .statut(n.getStatut())
                .donnees(n.getDonnees())
                .rendezVousId(n.getRendezVous() != null ? n.getRendezVous().getId() : null)
                .patientNom(n.getPatient() != null ? n.getPatient().getNomComplet() : null)
                .medecinNom(n.getMedecin() != null ? n.getMedecin().getNomComplet() : null)
                .build();
    }
}