import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = true;
  searchTerm = '';
  errorMessage = '';
  successMessage = '';
  
  showDeleteModal = false;
  showDetailsModal = false;
  patientToDelete: Patient | null = null;
  selectedPatient: Patient | null = null;
  patientDetails: any = null;
  loadingDetails = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  loadPatients(): void {
    this.loading = true;
    this.apiService.getAllPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.filteredPatients = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des patients.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    if (!this.searchTerm) {
      this.filteredPatients = this.patients;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredPatients = this.patients.filter(p => 
      `${p.prenom} ${p.nom}`.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.tel && p.tel.includes(term))
    );
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  openDetails(patient: Patient): void {
    this.selectedPatient = patient;
    this.showDetailsModal = true;
    this.loadingDetails = true;
    
    this.apiService.getPatientDetails(patient.id).subscribe({
      next: (details) => {
        this.patientDetails = details;
        this.loadingDetails = false;
      },
      error: () => {
        this.patientDetails = { nombreRendezVous: 0, dernierRendezVous: null };
        this.loadingDetails = false;
      }
    });
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedPatient = null;
    this.patientDetails = null;
  }

  openDeleteModal(patient: Patient): void {
    this.patientToDelete = patient;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.patientToDelete = null;
  }

  confirmDelete(): void {
    if (!this.patientToDelete) return;
    
    this.apiService.deletePatient(this.patientToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Patient supprimé avec succès.';
        this.closeDeleteModal();
        this.loadPatients();
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

  formatDate(date?: Date | string): string {
    if (!date) return 'Non renseignée';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getAge(dateNaissance?: Date | string): number | null {
    if (!dateNaissance) return null;
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getInitials(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }
}