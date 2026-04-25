import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RendezVous, RendezVousRequest } from '../../../models/rendezvous.model';
import { RendezVousService } from '../../../services/rendezvous.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mes-rendezvous',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './mes-rendezvous.component.html',
  styleUrls: ['./mes-rendezvous.component.css']
})
export class MesRendezvousComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  loading = true;
  errorMessage = '';
  editingRdv: RendezVous | null = null;

  dateMin = new Date().toISOString().split('T')[0];
  creneauxDisponibles: string[] = [];
  creneauxOccupes: string[] = [];
  loadingCreneaux = false;
  loadingOccupes = false;
  errorCreneaux = '';

  // Propriétés pour les modales et toasts
  showCancelModal = false;
  rdvToCancel: RendezVous | null = null;
  showSuccessModal = false;
  successMessage = '';
  showErrorModal = false;
  errorModalMessage = '';
  showEditSuccess = false;

  constructor(
    private rdvService: RendezVousService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRendezVous();
  }

  loadRendezVous(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) {
      this.errorMessage = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    this.rdvService.getRendezVousByPatient(patientId).subscribe({
      next: (data: RendezVous[]) => {
        this.rendezVous = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des rendez-vous';
        this.loading = false;
      }
    });
  }

  canModifyOrCancel(rdv: RendezVous): boolean {
    return rdv.statut === 'EN_ATTENTE';
  }

  startEdit(rdv: RendezVous): void {
    if (!this.canModifyOrCancel(rdv)) {
      this.showError('Vous ne pouvez modifier que les rendez-vous en attente de confirmation');
      return;
    }

    // Créer une copie et formater la date pour l'input HTML
    this.editingRdv = { 
      ...rdv,
      // Convertir la date au format YYYY-MM-DD pour l'input type="date"
      date: this.formatDateForInput(rdv.date)
    };

    this.loadCreneaux(this.editingRdv!.medecinId, this.editingRdv!.date);
  }

  // NOUVELLE MÉTHODE : Formater la date pour l'input HTML
  private formatDateForInput(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadCreneaux(medecinId: number, date: string): void {
    this.loadingCreneaux = true;
    this.loadingOccupes = true;
    this.errorCreneaux = '';

    this.rdvService.getCreneauxDisponibles(medecinId, date).subscribe({
      next: (disponibles) => {
        this.rdvService.getCreneauxOccupes(medecinId, date).subscribe({
          next: (occupes) => {
            this.creneauxOccupes = occupes;
            
            // SI on modifie un RDV existant et qu'on garde la même date,
            // son créneau actuel apparaît dans "occupes", donc on doit l'ajouter aux disponibles
            if (this.editingRdv && this.editingRdv.heure) {
              const heureActuelle = this.editingRdv.heure;
              // Si l'heure actuelle n'est pas dans disponibles (car "occupée" par nous-mêmes),
              // on l'ajoute quand même pour permettre de la sélectionner
              if (!disponibles.includes(heureActuelle) && occupes.includes(heureActuelle)) {
                // Vérifier si c'est notre propre RDV qui occupe ce créneau
                this.creneauxDisponibles = [...disponibles, heureActuelle].sort();
              } else {
                this.creneauxDisponibles = disponibles;
              }
            } else {
              this.creneauxDisponibles = disponibles;
            }
            
            this.loadingCreneaux = false;
            this.loadingOccupes = false;
          },
          error: () => {
            this.errorCreneaux = 'Erreur lors du chargement des créneaux';
            this.loadingCreneaux = false;
            this.loadingOccupes = false;
          }
        });
      },
      error: () => {
        this.errorCreneaux = 'Erreur lors du chargement des créneaux';
        this.loadingCreneaux = false;
      }
    });
  }

  loadCreneauxOccupes(medecinId: number, date: string): void {
    this.rdvService.getCreneauxOccupes(medecinId, date).subscribe({
      next: (data) => {
        this.creneauxOccupes = data;
        this.loadingCreneaux = false;
        this.loadingOccupes = false;
      },
      error: () => {
        this.errorCreneaux = 'Erreur lors du chargement des créneaux occupés';
        this.loadingCreneaux = false;
        this.loadingOccupes = false;
      }
    });
  }

  isCreneauOccupe(creneau: string): boolean {
    return this.creneauxOccupes.includes(creneau);
  }

  updateDate(): void {
    if (!this.editingRdv) return;
    // S'assurer qu'on recharge les créneaux pour la nouvelle date sélectionée
    this.loadCreneaux(this.editingRdv.medecinId, this.editingRdv.date);
  }

  saveEdit(): void {
    if (!this.editingRdv) return;

    if (this.isCreneauOccupe(this.editingRdv.heure)) {
      this.showError('Ce créneau vient d\'être réservé par un autre patient. Veuillez en choisir un autre.');
      this.updateDate();
      return;
    }

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    const request: RendezVousRequest = {
      patientId,
      medecinId: this.editingRdv.medecinId,
      date: this.editingRdv.date,
      heure: this.editingRdv.heure,
      motif: this.editingRdv.motif
    };

    this.rdvService.modifierRendezVous(this.editingRdv.id, request, patientId).subscribe({
      next: () => {
        this.editingRdv = null;
        this.showEditSuccess = true;
        this.loadRendezVous();
        setTimeout(() => this.showEditSuccess = false, 3000);
      },
      error: (err) => {
        console.error(err);
        this.showError(err.error?.message || 'Erreur lors de la modification');
      }
    });
  }

  cancelEdit(): void {
    this.editingRdv = null;
  }

  // NOUVELLE MÉTHODE : Ouvrir la modale de confirmation d'annulation
  openCancelModal(rdv: RendezVous): void {
    if (!this.canModifyOrCancel(rdv)) {
      this.showError('Vous ne pouvez annuler que les rendez-vous en attente');
      return;
    }
    this.rdvToCancel = rdv;
    this.showCancelModal = true;
  }

  // NOUVELLE MÉTHODE : Confirmer l'annulation
  confirmCancel(): void {
    if (!this.rdvToCancel) return;
    
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.rdvService.cancelRendezVous(this.rdvToCancel.id, patientId).subscribe({
      next: () => {
        this.closeCancelModal();
        this.showSuccess('Rendez-vous annulé avec succès');
        this.loadRendezVous();
      },
      error: (err) => {
        this.closeCancelModal();
        this.showError(err.error?.message || 'Erreur lors de l\'annulation');
      }
    });
  }

  // NOUVELLE MÉTHODE : Fermer la modale d'annulation
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.rdvToCancel = null;
  }

  // NOUVELLE MÉTHODE : Afficher le toast de succès
  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => this.showSuccessModal = false, 3000);
  }

  // NOUVELLE MÉTHODE : Afficher le toast d'erreur
  showError(message: string): void {
    this.errorModalMessage = message;
    this.showErrorModal = true;
  }

  // NOUVELLE MÉTHODE : Fermer le toast d'erreur
  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  getStatusColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'EN_ATTENTE': '#ffc107',
      'CONFIRME': '#28a745',
      'ANNULE': '#dc3545',
      'TERMINE': '#6c757d',
      'NON_VENU': '#6c757d'
    };
    return colors[statut] || '#6c757d';
  }

  getStatusBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'bg-warning text-dark',
      'CONFIRME': 'bg-success',
      'ANNULE': 'bg-danger',
      'TERMINE': 'bg-secondary',
      'NON_VENU': 'bg-secondary'
    };
    return classes[statut] || 'bg-secondary';
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'ANNULE': 'Annulé',
      'TERMINE': 'Terminé',
      'NON_VENU': 'Non venu'
    };
    return labels[statut] || statut;
  }
}