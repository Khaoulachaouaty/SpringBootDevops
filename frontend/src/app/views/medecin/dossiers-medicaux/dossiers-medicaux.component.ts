import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation, DossierMedicalResponse } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-dossiers-medicaux',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossiers-medicaux.component.html',
  styleUrls: ['./dossiers-medicaux.component.css']
})
export class DossiersMedicauxComponent implements OnInit {
  
  patients: any[] = [];
  selectedPatient: any = null;
  patientConsultations: Consultation[] = [];
  dossierMedical: DossierMedicalResponse | null = null;
  loading = false;
  updating = false;
  editingDossier = false;
  currentUserId: number | null = null;
  searchTerm: string = '';
  activeTab: string = 'consultations';
  
  // Texte du dossier médical (champ de la table patient)
  dossierText: string = '';
  
  // Modal détails consultation
  showDetailModal: boolean = false;
  selectedConsultation: Consultation | null = null;

  constructor(
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getMedecinId();
    this.loadPatients();
  }

  loadPatients(): void {
    if (!this.currentUserId) return;
    
    this.loading = true;
    this.rdvService.getRendezVousByMedecin(this.currentUserId).subscribe({
      next: (rdvs: any[]) => {
        const patientMap = new Map();
        rdvs.forEach(rdv => {
          if (!patientMap.has(rdv.patientId)) {
            patientMap.set(rdv.patientId, {
              id: rdv.patientId,
              nom: rdv.patientNom,
              prenom: rdv.patientPrenom,
              email: rdv.patientEmail,
              tel: rdv.patientTel
            });
          }
        });
        this.patients = Array.from(patientMap.values());
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get filteredPatients(): any[] {
    if (!this.searchTerm) return this.patients;
    const term = this.searchTerm.toLowerCase();
    return this.patients.filter(p => 
      p.nom.toLowerCase().includes(term) || 
      p.prenom.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  }

  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.activeTab = 'consultations';
    this.editingDossier = false;
    this.loadPatientData(patient.id);
  }

  loadPatientData(patientId: number): void {
    if (!this.currentUserId) return;
    
    // Charger les consultations
    this.rdvService.getConsultationsByPatient(patientId).subscribe({
      next: (consultations: Consultation[]) => {
        this.patientConsultations = consultations.filter(c => c.medecinId === this.currentUserId)
                                                .sort((a, b) => new Date(b.dateConsultation || '').getTime() - new Date(a.dateConsultation || '').getTime());
      }
    });

    // Charger le dossier médical (champ de la table patient)
    this.rdvService.consulterDossierMedical(patientId, this.currentUserId).subscribe({
      next: (dossier: DossierMedicalResponse) => {
        this.dossierMedical = dossier;
        this.dossierText = dossier?.dossierMedical || '';
      },
      error: (err) => {
        console.error('Erreur chargement dossier médical:', err);
        this.dossierMedical = null;
        this.dossierText = '';
      }
    });
  }

  // ============ GESTION DU DOSSIER MÉDICAL (table patient) ============

  saveDossierMedical(): void {
    if (!this.selectedPatient || !this.currentUserId) return;
    
    this.updating = true;
    
    this.rdvService.updateDossierMedical(this.selectedPatient.id, this.currentUserId, this.dossierText).subscribe({
      next: (dossier: DossierMedicalResponse) => {
        this.dossierMedical = dossier;
        this.dossierText = dossier?.dossierMedical || '';
        this.editingDossier = false;
        this.updating = false;
        alert('Dossier médical mis à jour avec succès');
      },
      error: (err) => {
        console.error('Erreur mise à jour dossier:', err);
        this.updating = false;
        alert('Erreur lors de la mise à jour du dossier médical');
      }
    });
  }

  cancelEditDossier(): void {
    this.editingDossier = false;
    this.dossierText = this.dossierMedical?.dossierMedical || '';
  }

  // ============ MODAL DÉTAILS CONSULTATION ============

  openDetailModal(consultation: Consultation): void {
    this.selectedConsultation = consultation;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedConsultation = null;
  }

  // ============ ACTIONS ============

  voirFacture(consultationId: number): void {
    if (consultationId) {
      this.router.navigate(['/medecin/facture', consultationId]);
    }
  }

  nouvelleConsultation(): void {
    this.router.navigate(['/medecin/rendezvous'], {
      queryParams: { patientId: this.selectedPatient?.id, action: 'new' }
    });
  }

  // ============ HELPERS ============

  getInitials(prenom: string, nom: string): string {
    return (prenom?.charAt(0) || '') + (nom?.charAt(0) || '');
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(montant || 0);
  }

  getPaiementStatusClass(statut: string): string {
    return statut === 'PAYE' ? 'badge-success' : 'badge-warning';
  }

  getPaiementStatusLabel(statut: string): string {
    return statut === 'PAYE' ? 'Payé' : 'En attente';
  }
}