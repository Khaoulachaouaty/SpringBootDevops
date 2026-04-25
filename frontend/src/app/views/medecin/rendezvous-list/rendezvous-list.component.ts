// rendezvous-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { RendezVous, Consultation } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-rendezvous-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rendezvous-list.component.html',
  styleUrls: ['./rendezvous-list.component.css']
})
export class RendezvousListComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  filteredRendezVous: RendezVous[] = [];
  loading = false;
  currentUserId: number | null = null;
  filterStatut: string = '';
  today = new Date();
  
  stats = {
    enAttente: 0,
    confirmes: 0,
    termines: 0,
    annules: 0,
    nonVenus: 0,
    total: 0
  };
  
  showModal = false;
  modalType: 'confirm' | 'cancel' | 'done' | 'noShow' | null = null;
  selectedRdv: RendezVous | null = null;

  // Formulaire consultation
  showConsultationForm = false;
  savingConsultation = false;
  consultationForm = {
    diagnostic: '',
    ordonnance: '',
    traitement: '',
    notes: '',
    prixConsultation: 50,
    montantMedicaments: 0,
    statutPaiement: 'EN_ATTENTE'
  };

  constructor(
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getMedecinId();
    this.loadRendezVous();
  }

  loadRendezVous(): void {
    if (!this.currentUserId) return;
    
    this.loading = true;
    this.rdvService.getRendezVousByMedecin(this.currentUserId).subscribe({
      next: (rdvs) => {
        this.rendezVous = rdvs.sort((a, b) => {
          const dateA = new Date(a.date + 'T' + a.heure);
          const dateB = new Date(b.date + 'T' + b.heure);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.calculateStats();
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement RDV:', err);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      enAttente: this.countByStatus('EN_ATTENTE'),
      confirmes: this.countByStatus('CONFIRME'),
      termines: this.countByStatus('TERMINE'),
      annules: this.countByStatus('ANNULE'),
      nonVenus: this.countByStatus('NON_VENU'),
      total: this.rendezVous.length
    };
  }

  countByStatus(status: string): number {
    return this.rendezVous.filter(r => r.statut === status).length;
  }

  applyFilter(): void {
    if (this.filterStatut) {
      this.filteredRendezVous = this.rendezVous.filter(r => r.statut === this.filterStatut);
    } else {
      this.filteredRendezVous = this.rendezVous;
    }
  }

  // ============ LOGIQUE METIER ============

  isDatePassee(rdv: RendezVous): boolean {
    const rdvDateTime = new Date(rdv.date + 'T' + rdv.heure);
    return rdvDateTime < new Date();
  }

  isToday(dateStr: string): boolean {
    const rdvDate = new Date(dateStr);
    return rdvDate.toDateString() === this.today.toDateString();
  }

  canConfirmer(rdv: RendezVous): boolean {
    return rdv.statut === 'EN_ATTENTE';
  }

  canAnnuler(rdv: RendezVous): boolean {
    return rdv.statut === 'EN_ATTENTE';
  }

  canTerminer(rdv: RendezVous): boolean {
    return rdv.statut === 'CONFIRME' && this.isDatePassee(rdv);
  }

  canMarquerNonVenu(rdv: RendezVous): boolean {
    return rdv.statut === 'CONFIRME' && this.isDatePassee(rdv);
  }

  hasConsultation(rdv: RendezVous): boolean {
    return rdv.statut === 'TERMINE';
  }

  // ============ MODALES ============

  openModal(type: 'confirm' | 'cancel' | 'done' | 'noShow', rdv: RendezVous): void {
    this.modalType = type;
    this.selectedRdv = rdv;
    
    if (type === 'done') {
      // Navigate to consultation-form page with query parameters
      this.router.navigate(['/medecin/consultation/new'], {
        queryParams: {
          rdvId: rdv.id,
          patientId: rdv.patientId,
          patientNom: rdv.patientNom,
          patientPrenom: rdv.patientPrenom,
          date: rdv.date,
          heure: rdv.heure,
          motif: rdv.motif
        }
      });
    } else {
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.modalType = null;
    this.selectedRdv = null;
  }

  closeConsultationForm(): void {
    this.showConsultationForm = false;
    this.selectedRdv = null;
  }

  confirmAction(): void {
    if (!this.selectedRdv || !this.currentUserId) return;

    switch (this.modalType) {
      case 'confirm':
        this.confirmerRdv();
        break;
      case 'cancel':
        this.annulerRdv();
        break;
      case 'noShow':
        this.marquerNonVenu();
        break;
    }
  }

  // ============ TERMINER AVEC FORMULAIRE ============

  submitConsultation(): void {
    if (!this.selectedRdv || !this.currentUserId) return;
    
    // Validation
    if (!this.consultationForm.diagnostic.trim()) {
      alert('Le diagnostic est obligatoire');
      return;
    }

    this.savingConsultation = true;

    // 1. Créer la consultation
    const consultationData = {
      diagnostic: this.consultationForm.diagnostic,
      ordonnance: this.consultationForm.ordonnance,
      traitement: this.consultationForm.traitement,
      notes: this.consultationForm.notes,
      prixConsultation: this.consultationForm.prixConsultation,
      montantMedicaments: this.consultationForm.montantMedicaments,
      statutPaiement: this.consultationForm.statutPaiement as 'EN_ATTENTE' | 'PAYE'
    };

    this.rdvService.createConsultation(this.selectedRdv.id, consultationData).subscribe({
      next: (consultation) => {
        // 2. Mettre à jour le statut du RDV
        this.rdvService.updateStatus(this.selectedRdv!.id, 'TERMINE', this.currentUserId!).subscribe({
          next: (updated) => {
            this.selectedRdv!.statut = updated.statut;
            this.savingConsultation = false;
            this.closeConsultationForm();
            this.updateView();
            
            this.showNotification('Consultation enregistrée et facture générée', 'success');
            
            // 3. Rediriger vers la facture (optionnel)
            // this.router.navigate(['/medecin/facture', consultation.id]);
          },
          error: (err) => {
            console.error('Erreur mise à jour statut:', err);
            this.savingConsultation = false;
            alert('Erreur lors de la mise à jour du statut');
          }
        });
      },
      error: (err) => {
        console.error('Erreur création consultation:', err);
        this.savingConsultation = false;
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  // ============ AUTRES ACTIONS ============

  private confirmerRdv(): void {
    this.rdvService.updateStatus(this.selectedRdv!.id, 'CONFIRME', this.currentUserId!).subscribe({
      next: (updated) => {
        this.selectedRdv!.statut = updated.statut;
        this.updateView();
        this.closeModal();
        this.showNotification('Rendez-vous confirmé avec succès', 'success');
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
        this.closeModal();
      }
    });
  }

  private annulerRdv(): void {
    this.rdvService.updateStatus(this.selectedRdv!.id, 'ANNULE', this.currentUserId!).subscribe({
      next: (updated) => {
        this.selectedRdv!.statut = updated.statut;
        this.updateView();
        this.closeModal();
        this.showNotification('Rendez-vous annulé avec succès', 'warning');
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
        this.closeModal();
      }
    });
  }

  private marquerNonVenu(): void {
    this.rdvService.updateStatus(this.selectedRdv!.id, 'NON_VENU', this.currentUserId!).subscribe({
      next: (updated) => {
        this.selectedRdv!.statut = updated.statut;
        this.updateView();
        this.closeModal();
        this.showNotification('Patient marqué comme non venu', 'info');
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
        this.closeModal();
      }
    });
  }

  private updateView(): void {
    this.calculateStats();
    this.applyFilter();
  }

  private showNotification(message: string, type: string): void {
    // Toast notification
    console.log(`[${type}] ${message}`);
    // Implémenter un toast si nécessaire
  }

  // ============ NAVIGATION ============

  voirConsultation(rdv: RendezVous): void {
    this.rdvService.getConsultationByRendezVous(rdv.id).subscribe({
      next: (consultation) => {
        this.router.navigate(['/medecin/consultation', consultation.id]);
      },
      error: () => {
        alert('Aucune consultation trouvée pour ce rendez-vous');
      }
    });
  }

  voirDossierMedical(rdv: RendezVous): void {
    this.router.navigate(['/medecin/dossiers'], {
      queryParams: {
        patientId: rdv.patientId
      }
    });
  }

  // ============ HELPERS ============

  getStatusClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'CONFIRME': 'success',
      'EN_ATTENTE': 'warning',
      'ANNULE': 'danger',
      'TERMINE': 'primary',
      'NON_VENU': 'secondary'
    };
    return classes[statut] || 'secondary';
  }

  getStatusIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'CONFIRME': 'bi-check-circle-fill',
      'EN_ATTENTE': 'bi-hourglass-split',
      'ANNULE': 'bi-x-circle-fill',
      'TERMINE': 'bi-check-all',
      'NON_VENU': 'bi-person-x-fill'
    };
    return icons[statut] || 'bi-circle';
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'CONFIRME': 'Confirmé',
      'EN_ATTENTE': 'En attente',
      'ANNULE': 'Annulé',
      'TERMINE': 'Terminé',
      'NON_VENU': 'Non venu'
    };
    return labels[statut] || statut;
  }

  getRowClass(rdv: RendezVous): string {
    if (rdv.statut === 'ANNULE') return 'table-secondary opacity-50';
    if (rdv.statut === 'TERMINE') return 'table-primary bg-opacity-25';
    if (rdv.statut === 'NON_VENU') return 'table-dark bg-opacity-10';
    if (this.isToday(rdv.date)) return 'table-warning';
    if (this.isDatePassee(rdv) && rdv.statut === 'CONFIRME') return 'table-danger';
    return '';
  }

  getModalTitle(): string {
    const titles: { [key: string]: string } = {
      'confirm': 'Confirmer le rendez-vous',
      'cancel': 'Annuler le rendez-vous',
      'done': 'Terminer la consultation',
      'noShow': 'Patient non venu'
    };
    return titles[this.modalType || ''] || 'Confirmation';
  }

  getModalIcon(): string {
    const icons: { [key: string]: string } = {
      'confirm': 'bi-check-circle',
      'cancel': 'bi-x-circle',
      'done': 'bi-file-medical',
      'noShow': 'bi-person-x'
    };
    return icons[this.modalType || ''] || 'bi-question-circle';
  }

  getModalColor(): string {
    const colors: { [key: string]: string } = {
      'confirm': 'success',
      'cancel': 'danger',
      'done': 'primary',
      'noShow': 'secondary'
    };
    return colors[this.modalType || ''] || 'primary';
  }

  getModalMessage(): string {
    if (!this.selectedRdv) return '';
    
    const patient = `${this.selectedRdv.patientPrenom} ${this.selectedRdv.patientNom}`;
    const dateHeure = `${this.formatDate(this.selectedRdv.date)} à ${this.selectedRdv.heure}`;
    
    switch (this.modalType) {
      case 'confirm':
        return `Confirmer le rendez-vous de <strong>${patient}</strong> prévu le <strong>${dateHeure}</strong> ?`;
      case 'cancel':
        return `Annuler le rendez-vous de <strong>${patient}</strong> prévu le <strong>${dateHeure}</strong> ?<br><span class="text-danger small">Le patient sera notifié.</span>`;
      case 'noShow':
        return `Confirmer que <strong>${patient}</strong> n'est pas venu à son rendez-vous du <strong>${dateHeure}</strong> ?`;
      default:
        return '';
    }
  }

  getMontantTotal(): number {
    return (this.consultationForm.prixConsultation || 0) + (this.consultationForm.montantMedicaments || 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  getConfirmButtonText(): string {
    const texts: { [key: string]: string } = {
      'confirm': 'Confirmer',
      'cancel': 'Annuler',
      'done': 'Terminer',
      'noShow': 'Marquer non venu'
    };
    return texts[this.modalType || ''] || 'Confirmer';
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.charAt(0) || '') + (nom?.charAt(0) || '');
  }
}