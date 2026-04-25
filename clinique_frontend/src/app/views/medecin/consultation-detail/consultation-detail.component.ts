import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-primary">Détail Consultation #{{ consultationId }}</h2>
        <button class="btn btn-outline-secondary" (click)="retour()">
          <i class="bi bi-arrow-left me-2"></i>Retour
        </button>
      </div>
      
      <div class="card" *ngIf="consultation">
        <div class="card-body">
          <h5>Diagnostic</h5>
          <p>{{ consultation.diagnostic }}</p>
          
          <h5>Traitement</h5>
          <p>{{ consultation.traitement || 'Non spécifié' }}</p>
          
          <h5>Ordonnance</h5>
          <p>{{ consultation.ordonnance || 'Non spécifiée' }}</p>
          
          <hr>
          
          <div class="d-flex justify-content-between">
            <span>Montant total:</span>
            <span class="fw-bold">{{ consultation.montantTotal | currency:'EUR' }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConsultationDetailComponent implements OnInit {
  consultationId: number | null = null;
  consultation: any = null;

  constructor(
    private route: ActivatedRoute,
    private rdvService: RendezVousService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.consultationId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.consultationId) {
      this.loadConsultation();
    }
  }

  loadConsultation(): void {
    this.rdvService.getConsultationById(this.consultationId!).subscribe({
      next: (data) => this.consultation = data,
      error: (err) => {
        console.error('Erreur chargement consultation:', err);
        alert('Consultation non trouvée');
        this.retour();
      }
    });
  }

  retour(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }
}