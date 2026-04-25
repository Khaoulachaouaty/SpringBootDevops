package com.itbs.clinique.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itbs.clinique.entities.Notification;

import java.util.Date;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // ========== PAR PATIENT ==========
    List<Notification> findByPatientIdOrderByDateEnvoiDesc(Long patientId);
    
    List<Notification> findByPatientIdAndStatutOrderByDateEnvoiDesc(Long patientId, String statut);
    
    long countByPatientIdAndStatut(Long patientId, String statut);
    
    // ========== PAR MÉDECIN ==========
    List<Notification> findByMedecinIdOrderByDateEnvoiDesc(Long medecinId);
    
    // 🔥 AJOUTÉ : Pour récupérer les notifications non lues du médecin
    List<Notification> findByMedecinIdAndStatutOrderByDateEnvoiDesc(Long medecinId, String statut);
    
    // 🔥 AJOUTÉ : Pour compter les notifications non lues du médecin
    long countByMedecinIdAndStatut(Long medecinId, String statut);
    
    // ========== REQUÊTES PERSONNALISÉES ==========
    @Query("SELECT n FROM Notification n WHERE n.rendezVous.id = :rdvId AND n.type = 'RAPPEL_RDV'")
    List<Notification> findRappelsByRendezVousId(@Param("rdvId") Long rdvId);
    
    @Query("SELECT n FROM Notification n WHERE n.statut = 'NON_LUE' AND n.dateEnvoi <= :now")
    List<Notification> findNotificationsNonLues(@Param("now") Date now);
}