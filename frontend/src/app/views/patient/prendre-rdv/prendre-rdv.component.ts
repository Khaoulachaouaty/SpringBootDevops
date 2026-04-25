// views/patient/prendre-rdv/prendre-rdv.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Medecin } from '../../../models/medecin.model';
import { RendezVousRequest } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-prendre-rdv',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './prendre-rdv.component.html',
  styleUrls: ['./prendre-rdv.component.css']
})
export class PrendreRdvComponent implements OnInit {
  etape = 1;
  medecins: Medecin[] = [];
  medecinsFiltres: Medecin[] = [];
  specialites: string[] = [];
  
  // Filtres
  specialiteSelectionnee = '';
  rechercheMedecin = '';
  
  medecinSelectionne: Medecin | null = null;
  dateSelectionnee = ''; // 🔥 vide par défaut pour afficher le message
  creneauSelectionne = '';
  creneauxDisponibles: string[] = [];
  creneauxOccupes: string[] = [];
  
  // États de chargement
  loadingCreneaux = false;
  loadingOccupes = false;
  isLoading = false;
  
  errorMessage = '';

  // Interdire le jour courant : dateMin = demain
  dateMin: string = '';

  rdvForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router
  ) {
    this.rdvForm = this.fb.group({
      motif: ['', [Validators.required, Validators.minLength(5)]]
    });

    // 🔥 Calcul de demain pour dateMin
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = ('0' + (tomorrow.getMonth() + 1)).slice(-2);
    const dd = ('0' + tomorrow.getDate()).slice(-2);

    this.dateMin = `${yyyy}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    this.loadMedecins();
  }

  loadMedecins(): void {
    this.apiService.getPublicMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
        this.medecinsFiltres = [...data];
        this.specialites = [...new Set(data.map(m => m.specialite))].filter(Boolean).sort();
      },
      error: () => this.errorMessage = 'Erreur lors du chargement des médecins'
    });
  }

  filtrerMedecins(): void {
    this.medecinsFiltres = this.medecins.filter(m => {
      const matchSpecialite = !this.specialiteSelectionnee || m.specialite === this.specialiteSelectionnee;
      const matchRecherche = !this.rechercheMedecin || 
        `${m.prenom} ${m.nom}`.toLowerCase().includes(this.rechercheMedecin.toLowerCase()) ||
        m.specialite.toLowerCase().includes(this.rechercheMedecin.toLowerCase());
      return matchSpecialite && matchRecherche;
    });
  }

  onSpecialiteChange(): void {
    this.filtrerMedecins();
  }

  onRechercheChange(): void {
    this.filtrerMedecins();
  }

  selectionnerMedecin(medecin: Medecin): void {
    this.medecinSelectionne = medecin;
    this.creneauSelectionne = '';
    this.creneauxDisponibles = [];
    this.creneauxOccupes = [];
    this.dateSelectionnee = ''; // 🔥 vide pour afficher le message
  }

  onDateChange(): void {
    if (!this.dateSelectionnee || !this.medecinSelectionne) return;

    this.loadingCreneaux = true;
    this.loadingOccupes = true;
    this.creneauSelectionne = '';
    this.creneauxOccupes = [];

    this.rdvService.getCreneauxDisponibles(this.medecinSelectionne.id, this.dateSelectionnee)
      .subscribe({
        next: (creneaux) => {
          this.creneauxDisponibles = creneaux;
          this.loadCreneauxOccupes();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des créneaux';
          this.loadingCreneaux = false;
          this.loadingOccupes = false;
        }
      });
  }

  loadCreneauxOccupes(): void {
    if (!this.medecinSelectionne || !this.dateSelectionnee) {
      this.loadingCreneaux = false;
      this.loadingOccupes = false;
      return;
    }

    this.rdvService.getCreneauxOccupes(this.medecinSelectionne.id, this.dateSelectionnee)
      .subscribe({
        next: (occupes) => {
          this.creneauxOccupes = occupes;
          this.loadingCreneaux = false;
          this.loadingOccupes = false;
        },
        error: () => {
          this.loadingCreneaux = false;
          this.loadingOccupes = false;
          this.errorMessage = 'Erreur lors du chargement des créneaux occupés';
        }
      });
  }

  isCreneauOccupe(creneau: string): boolean {
    return this.creneauxOccupes.includes(creneau);
  }

  selectionnerCreneau(creneau: string): void {
    if (this.isCreneauOccupe(creneau)) {
      this.errorMessage = 'Ce créneau est déjà réservé. Veuillez en choisir un autre.';
      return;
    }
    this.creneauSelectionne = creneau;
    this.errorMessage = '';
  }

  confirmerRdv(): void {
    if (this.rdvForm.invalid || !this.medecinSelectionne || !this.dateSelectionnee || !this.creneauSelectionne) {
      this.rdvForm.markAllAsTouched();
      return;
    }

    if (this.isCreneauOccupe(this.creneauSelectionne)) {
      this.errorMessage = 'Ce créneau vient d\'être réservé par un autre patient. Veuillez en choisir un autre.';
      this.onDateChange();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const patientId = this.authService.currentUser()?.userId;
    if (!patientId) {
      this.errorMessage = 'Erreur: Patient non identifié. Veuillez vous reconnecter.';
      this.isLoading = false;
      return;
    }

    const request: RendezVousRequest = {
      patientId,
      medecinId: this.medecinSelectionne.id,
      date: this.dateSelectionnee,
      heure: this.creneauSelectionne,
      motif: this.rdvForm.value.motif
    };

    this.rdvService.createRendezVous(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.etape = 4;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la création du rendez-vous. Veuillez réessayer.';
        if (err.error?.message?.includes('déjà réservé')) {
          this.onDateChange();
        }
      }
    });
  }

  reset(): void {
    this.etape = 1;
    this.medecinSelectionne = null;
    this.specialiteSelectionnee = '';
    this.rechercheMedecin = '';
    this.medecinsFiltres = [...this.medecins];
    this.dateSelectionnee = '';
    this.creneauSelectionne = '';
    this.creneauxDisponibles = [];
    this.creneauxOccupes = [];
    this.errorMessage = '';
    this.rdvForm.reset();
  }

  retourEtape1(): void {
    this.etape = 1;
    this.medecinSelectionne = null;
    this.dateSelectionnee = '';
    this.creneauSelectionne = '';
    this.creneauxDisponibles = [];
    this.creneauxOccupes = [];
  }

  retourEtape2(): void {
    this.etape = 2;
    this.creneauSelectionne = '';
  }

  get creneauxLibres(): number {
    return this.creneauxDisponibles.length - this.creneauxOccupes.length;
  }

  get pourcentageOccupation(): number {
    if (this.creneauxDisponibles.length === 0) return 0;
    return Math.round((this.creneauxOccupes.length / this.creneauxDisponibles.length) * 100);
  }
}