import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RendezVous } from '../../../models/rendezvous.model';
import { RendezVousService } from '../../../services/rendezvous.service';

@Component({
  selector: 'app-gestion-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rendezvous-list.component.html',
  styleUrls: ['./rendezvous-list.component.css']
})
export class GestionRendezvousComponent implements OnInit {

  rendezVous: RendezVous[] = [];
  filteredRendezVous: RendezVous[] = [];
  loading = true;

  searchTerm = '';
  selectedStatut = '';
  selectedDate = '';

  errorMessage = '';
  successMessage = '';

  // ✅ uniquement modal détails
  showDetailsModal = false;
  selectedRdv: RendezVous | null = null;

  statuts = ['EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE'];

  constructor(private rdvService: RendezVousService) {}

  ngOnInit(): void {
    this.loadRendezVous();
  }

  loadRendezVous(): void {
    this.loading = true;
    this.rdvService.getAllRendezVous().subscribe({
      next: (data) => {
        this.rendezVous = data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.filteredRendezVous = [...this.rendezVous];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des rendez-vous.';
        this.loading = false;
      }
    });
  }

  // ✅ FILTRES
  applyFilters(): void {
    let result = [...this.rendezVous];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(rdv =>
        `${rdv.patientPrenom} ${rdv.patientNom}`.toLowerCase().includes(term) ||
        `${rdv.medecinPrenom} ${rdv.medecinNom}`.toLowerCase().includes(term) ||
        (rdv.motif && rdv.motif.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatut) {
      result = result.filter(rdv => rdv.statut === this.selectedStatut);
    }

    if (this.selectedDate) {
      result = result.filter(rdv => {
        const rdvDate = new Date(rdv.date).toISOString().split('T')[0];
        return rdvDate === this.selectedDate;
      });
    }

    this.filteredRendezVous = result;
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onStatutChange(event: Event): void {
    this.selectedStatut = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onDateChange(event: Event): void {
    this.selectedDate = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.selectedDate = '';
    this.filteredRendezVous = [...this.rendezVous];
  }

  // ✅ MODAL DÉTAILS UNIQUEMENT
  openDetails(rdv: RendezVous): void {
    this.selectedRdv = rdv;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedRdv = null;
  }

  // ✅ FORMAT
  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatutBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'bg-warning text-dark',
      'CONFIRME': 'bg-success',
      'ANNULE': 'bg-danger',
      'TERMINE': 'bg-secondary'
    };
    return classes[statut] || 'bg-secondary';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'ANNULE': 'Annulé',
      'TERMINE': 'Terminé'
    };
    return labels[statut] || statut;
  }
}