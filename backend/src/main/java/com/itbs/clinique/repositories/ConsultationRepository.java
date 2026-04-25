package com.itbs.clinique.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itbs.clinique.entities.Consultation;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    
    Optional<Consultation> findByRendezVousId(Long rendezVousId);
    
    // ✅ CORRIGÉ : remplacer OrderByDateConsultationDesc par OrderByRendezVousDateDesc
    List<Consultation> findByRendezVousMedecinIdOrderByRendezVousDateDesc(Long medecinId);
    
    // ✅ CORRIGÉ : remplacer OrderByDateConsultationDesc par OrderByRendezVousDateDesc
    List<Consultation> findByRendezVousPatientIdOrderByRendezVousDateDesc(Long patientId);
    
    // ✅ CORRIGÉ : remplacer c.dateConsultation par c.rendezVous.date
    @Query("SELECT c FROM Consultation c WHERE c.rendezVous.medecin.id = :medecinId AND c.rendezVous.date BETWEEN :debut AND :fin")
    List<Consultation> findByMedecinAndPeriode(@Param("medecinId") Long medecinId, 
                                                @Param("debut") Date debut, 
                                                @Param("fin") Date fin);
    
    @Query("SELECT SUM(c.montantTotal) FROM Consultation c WHERE c.rendezVous.medecin.id = :medecinId AND c.statutPaiement = 'PAYE'")
    Double calculerRevenusMedecin(@Param("medecinId") Long medecinId);
    
    @Query("SELECT c FROM Consultation c WHERE c.statutPaiement = 'EN_ATTENTE' AND c.rendezVous.patient.id = :patientId")
    List<Consultation> findFacturesEnAttenteByPatient(@Param("patientId") Long patientId);
}