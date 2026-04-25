package com.itbs.clinique.services;

import com.itbs.clinique.entities.Medecin;
import com.itbs.clinique.entities.Patient;
import com.itbs.clinique.entities.RendezVous;
import com.itbs.clinique.repositories.MedecinRepository;
import com.itbs.clinique.repositories.PatientRepository;
import com.itbs.clinique.repositories.RendezVousRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RendezVousServiceImplTest {

    @Mock
    private RendezVousRepository rendezVousRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private MedecinRepository medecinRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private RendezVousServiceImpl service;

    private Patient patient;
    private Medecin medecin;
    private RendezVous rdv;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);

        medecin = new Medecin();
        medecin.setId(10L);

        rdv = new RendezVous();
        rdv.setId(100L);
        rdv.setPatient(patient);
        rdv.setMedecin(medecin);
        rdv.setStatut("EN_ATTENTE");
    }

    @Test
    void cancelRendezVous_success() {
        when(patientRepository.findByUserUserId(1L)).thenReturn(Optional.of(patient));
        when(rendezVousRepository.findById(100L)).thenReturn(Optional.of(rdv));
        doNothing().when(notificationService).notifierAnnulationRdvParPatient(rdv);

        assertDoesNotThrow(() -> service.cancelRendezVous(100L, 1L));

        assertEquals("ANNULE", rdv.getStatut());
        verify(rendezVousRepository).save(rdv);
        verify(notificationService).notifierAnnulationRdvParPatient(rdv);
    }

    @Test
    void cancelRendezVous_throwsWhenAlreadyConfirmed() {
        rdv.setStatut("CONFIRME");
        when(patientRepository.findByUserUserId(1L)).thenReturn(Optional.of(patient));
        when(rendezVousRepository.findById(100L)).thenReturn(Optional.of(rdv));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.cancelRendezVous(100L, 1L));

        assertTrue(ex.getMessage().contains("confirmé"));
        verify(rendezVousRepository, never()).save(any());
    }

    @Test
    void cancelRendezVous_throwsWhenPatientNotOwner() {
        Patient autre = new Patient();
        autre.setId(99L);
        when(patientRepository.findByUserUserId(2L)).thenReturn(Optional.of(autre));
        when(rendezVousRepository.findById(100L)).thenReturn(Optional.of(rdv));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.cancelRendezVous(100L, 2L));

        assertTrue(ex.getMessage().contains("autorisé"));
    }

    @Test
    void cancelRendezVous_throwsWhenRdvNotFound() {
        when(patientRepository.findByUserUserId(1L)).thenReturn(Optional.of(patient));
        when(rendezVousRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.cancelRendezVous(999L, 1L));
    }
}
