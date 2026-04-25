// views/patient/facture-view-patient/facture-view-patient.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';

@Component({
  selector: 'app-facture-view-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facture-view-patient.component.html',
  styleUrls: ['./facture-view-patient.component.css']
})
export class FactureViewPatientComponent implements OnInit {
  consultationId: number | null = null;
  facture: any = null;
  loading = false;

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
    this.loading = true;
    this.rdvService.genererFacture(this.consultationId!).subscribe({
      next: (data) => {
        this.facture = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement facture:', err);
        alert('Facture non trouvée');
        this.loading = false;
        this.retour();
      }
    });
  }

  retour(): void {
    this.router.navigate(['/patient/paiements']);
  }

  telechargerPDF(): void {
    this.rdvService.genererFacturePDF(this.consultationId!).subscribe({
      next: (facture) => {
        alert(`Facture N° ${facture.numeroFacture} prête au téléchargement`);
      },
      error: (err) => {
        console.error('Erreur génération PDF:', err);
        alert('Erreur lors de la génération du PDF');
      }
    });
  }

  imprimer(): void {
    window.print();
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(montant || 0);
  }
}