import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';

@Component({
  selector: 'app-facture-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-primary">Facture</h2>
        <button class="btn btn-outline-secondary" (click)="retour()">
          <i class="bi bi-arrow-left me-2"></i>Retour
        </button>
      </div>
      
      <div class="card" *ngIf="facture">
        <div class="card-body">
          <div class="text-center mb-4">
            <h4>Facture N° {{ facture.numeroFacture }}</h4>
            <p class="text-muted">{{ facture.dateFacture | date:'dd/MM/yyyy' }}</p>
          </div>
          
          <div class="row mb-4">
            <div class="col-md-6">
              <h6>Patient:</h6>
              <p>{{ facture.patientNomComplet }}</p>
            </div>
            <div class="col-md-6 text-md-end">
              <h6>Médecin:</h6>
              <p>Dr. {{ facture.medecinNomComplet }}</p>
              <small class="text-muted">{{ facture.medecinSpecialite }}</small>
            </div>
          </div>
          
          <table class="table">
            <tr>
              <td>Consultation</td>
              <td class="text-end">{{ facture.prixConsultation | currency:'EUR' }}</td>
            </tr>
            <tr>
              <td>Médicaments</td>
              <td class="text-end">{{ facture.montantMedicaments | currency:'EUR' }}</td>
            </tr>
            <tr class="fw-bold">
              <td>TOTAL</td>
              <td class="text-end text-primary">{{ facture.montantTotal | currency:'EUR' }}</td>
            </tr>
          </table>
          
          <div class="text-center mt-4">
            <span class="badge" [class.bg-success]="facture.statutPaiement === 'PAYE'"
                              [class.bg-warning]="facture.statutPaiement === 'EN_ATTENTE'">
              {{ facture.statutPaiement === 'PAYE' ? 'Payé' : 'En attente de paiement' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FactureViewComponent implements OnInit {
  consultationId: number | null = null;
  facture: any = null;

  constructor(
    private route: ActivatedRoute,
    private rdvService: RendezVousService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.consultationId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.consultationId) {
      this.loadFacture();
    }
  }

  loadFacture(): void {
    this.rdvService.genererFacture(this.consultationId!).subscribe({
      next: (data) => this.facture = data,
      error: (err) => {
        console.error('Erreur chargement facture:', err);
        alert('Facture non trouvée');
        this.retour();
      }
    });
  }

  retour(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }
}