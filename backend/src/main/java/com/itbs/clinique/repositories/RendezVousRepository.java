package com.itbs.clinique.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itbs.clinique.entities.RendezVous;

import java.util.Date;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    
    int countByMedecinId(Long medecinId);
    
    @Query("SELECT COUNT(DISTINCT r.patient.id) FROM RendezVous r WHERE r.medecin.id = :medecinId")
    int countDistinctPatientsByMedecinId(@Param("medecinId") Long medecinId);
    
    List<RendezVous> findByPatientId(Long patientId);
    List<RendezVous> findByMedecinId(Long medecinId);
    List<RendezVous> findByMedecinIdAndDate(Long medecinId, Date date);
    List<RendezVous> findByMedecinIdAndDateBetween(Long medecinId, Date start, Date end);
    
    @Query("SELECT r FROM RendezVous r WHERE r.medecin.specialite = :specialite")
    List<RendezVous> findByMedecinSpecialite(@Param("specialite") String specialite);
    
    // 🔥 CORRECTION: Requête JPQL complète pour vérifier si créneau est occupé
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM RendezVous r " +
           "WHERE r.medecin.id = :medecinId " +
           "AND r.date = :date " +
           "AND r.heure = :heure " +
           "AND r.statut IN ('EN_ATTENTE', 'CONFIRME')")
    boolean isCreneauOccupe(@Param("medecinId") Long medecinId, 
                            @Param("date") Date date, 
                            @Param("heure") String heure);
    
    // 🔥 Méthode alternative avec Query native si JPQL ne marche pas
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END " +
           "FROM rendez_vous r " +
           "WHERE r.medecin_id = :medecinId " +
           "AND r.date = :date " +
           "AND r.heure = :heure " +
           "AND r.statut IN ('EN_ATTENTE', 'CONFIRME')", 
           nativeQuery = true)
    int isCreneauOccupeNative(@Param("medecinId") Long medecinId, 
                              @Param("date") Date date, 
                              @Param("heure") String heure);
    
    // Pour debug - trouver tous les RDV à un créneau
    @Query("SELECT r FROM RendezVous r " +
           "WHERE r.medecin.id = :medecinId " +
           "AND r.date = :date " +
           "AND r.heure = :heure")
    List<RendezVous> findByMedecinIdAndDateAndHeure(@Param("medecinId") Long medecinId, 
                                                    @Param("date") Date date, 
            
                                            @Param("heure") String heure);
    
    @Query("SELECT r FROM RendezVous r WHERE r.date BETWEEN :debut AND :fin AND r.statut = :statut")
    List<RendezVous> findByDateBetweenAndStatut(@Param("debut") Date debut, 
                                                   @Param("fin") Date fin, 
                                                   @Param("statut") String statut);
}

