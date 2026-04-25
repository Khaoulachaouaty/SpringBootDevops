import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Medecin } from '../../../models/medecin.model';

@Component({
  selector: 'app-medecin-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medecin-list.component.html',
  styleUrls: ['./medecin-list.component.css']
})
export class MedecinListComponent implements OnInit {
  medecins: Medecin[] = [];
  filteredMedecins: Medecin[] = [];
  loading = true;
  searchTerm = '';
  selectedSpecialite = '';
  errorMessage = '';
  successMessage = '';
  
  showDeleteModal = false;
  showDetailsModal = false;
  medecinToDelete: Medecin | null = null;
  selectedMedecin: Medecin | null = null;
  medecinDetails: any = null;
  loadingDetails = false;

  specialites: string[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedecins();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  loadMedecins(): void {
    this.loading = true;
    this.apiService.getAllMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
        this.filteredMedecins = data;
        this.extractSpecialites();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement.';
        this.loading = false;
      }
    });
  }

  extractSpecialites(): void {
    this.specialites = [...new Set(this.medecins.map(m => m.specialite))].sort();
  }

  applyFilters(): void {
    let result = this.medecins;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m => 
        `${m.prenom} ${m.nom}`.toLowerCase().includes(term) ||
        m.specialite.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
      );
    }
    if (this.selectedSpecialite) {
      result = result.filter(m => m.specialite === this.selectedSpecialite);
    }
    this.filteredMedecins = result;
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onSpecialiteChange(event: Event): void {
    this.selectedSpecialite = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSpecialite = '';
    this.applyFilters();
  }

  openDetails(medecin: Medecin): void {
    this.selectedMedecin = medecin;
    this.showDetailsModal = true;
    this.loadingDetails = true;
    
    this.apiService.getMedecinDetails(medecin.id).subscribe({
      next: (details) => {
        this.medecinDetails = details;
        this.loadingDetails = false;
      },
      error: () => {
        this.medecinDetails = { nombrePatients: 0, rendezVousTotal: 0 };
        this.loadingDetails = false;
      }
    });
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedMedecin = null;
    this.medecinDetails = null;
  }

  openDeleteModal(medecin: Medecin): void {
    this.medecinToDelete = medecin;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.medecinToDelete = null;
  }

  confirmDelete(): void {
    if (!this.medecinToDelete) return;
    
    this.apiService.deleteMedecin(this.medecinToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Médecin supprimé avec succès.';
        this.closeDeleteModal();
        this.loadMedecins();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
        this.closeDeleteModal();
      }
    });
  }

  formatPhone(tel?: string): string {
    if (!tel || tel.length !== 8) return 'Non renseigné';
    return `${tel.slice(0,2)} ${tel.slice(2,4)} ${tel.slice(4,6)} ${tel.slice(6,8)}`;
  }

  getInitials(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }
}