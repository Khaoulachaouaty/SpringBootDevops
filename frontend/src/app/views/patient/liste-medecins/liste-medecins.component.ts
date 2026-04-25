// views/patient/liste-medecins/liste-medecins.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Medecin } from '../../../models/medecin.model';

@Component({
  selector: 'app-liste-medecins',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4 text-success">
        <i class="bi bi-heart-pulse me-2"></i>Nos Médecins
      </h2>

      <!-- Filtres -->
      <div class="card mb-4 border-0 shadow-sm">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Spécialité</label>
              <select class="form-select" [(ngModel)]="specialiteFiltre" (change)="filtrer()">
                <option value="">Toutes les spécialités</option>
                @for (spec of specialites; track spec) {
                  <option [value]="spec">{{ spec }}</option>
                }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Rechercher</label>
              <input type="text" class="form-control" [(ngModel)]="recherche" 
                     (input)="filtrer()" placeholder="Nom du médecin...">
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-success"></div>
        </div>
      } @else {
        <div class="row g-4">
          @for (medecin of medecinsFiltres; track medecin.id) {
            <div class="col-md-6 col-lg-4">
              <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                         style="width: 60px; height: 60px; font-size: 1.3rem;">
                      {{ medecin.prenom.charAt(0) }}{{ medecin.nom.charAt(0) }}
                    </div>
                    <div>
                      <h5 class="mb-1">Dr. {{ medecin.prenom }} {{ medecin.nom }}</h5>
                      <span class="badge bg-warning bg-opacity-10 text-warning">
                        {{ medecin.specialite }}
                      </span>
                    </div>
                  </div>
                  
                  <p class="text-muted mb-3">
                    <i class="bi bi-telephone me-2"></i>{{ medecin.tel || 'Non renseigné' }}
                  </p>
                  
                  <a [routerLink]="['/patient/prendre-rdv']" 
                     [queryParams]="{medecinId: medecin.id}"
                     class="btn btn-success w-100">
                    <i class="bi bi-calendar-plus me-2"></i>Prendre RDV
                  </a>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-12 text-center py-5">
              <i class="bi bi-search display-1 text-muted opacity-25"></i>
              <p class="text-muted mt-2">Aucun médecin trouvé</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ListeMedecinsComponent implements OnInit {
  medecins: Medecin[] = [];
  medecinsFiltres: Medecin[] = [];
  specialites: string[] = [];
  specialiteFiltre = '';
  recherche = '';
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMedecins();
  }

  loadMedecins(): void {
    this.apiService.getPublicMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
        this.medecinsFiltres = [...data];
        this.specialites = [...new Set(data.map(m => m.specialite))].filter(Boolean).sort();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  filtrer(): void {
    this.medecinsFiltres = this.medecins.filter(m => {
      const matchSpec = !this.specialiteFiltre || m.specialite === this.specialiteFiltre;
      const matchSearch = !this.recherche || 
        `${m.prenom} ${m.nom}`.toLowerCase().includes(this.recherche.toLowerCase());
      return matchSpec && matchSearch;
    });
  }
}