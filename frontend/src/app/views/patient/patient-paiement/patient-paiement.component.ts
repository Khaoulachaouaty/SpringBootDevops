// views/patient/patient-paiement/patient-paiement.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-patient-paiement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-paiement.component.html',
  styleUrls: ['./patient-paiement.component.css']
})
export class PatientPaiementComponent implements OnInit {
  
  consultations: Consultation[] = [];
  loading = false;
  totalAPayer = 0;
  totalPaye = 0;

  constructor(
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading = true;
    this.rdvService.getConsultationsByPatient(patientId).subscribe({
      next: (consultations) => {
        this.consultations = consultations.sort((a, b) => 
          new Date(b.dateConsultation || 0).getTime() - new Date(a.dateConsultation || 0).getTime()
        );
        this.calculateTotals();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement factures:', err);
        this.loading = false;
      }
    });
  }

  calculateTotals(): void {
    this.totalAPayer = this.consultations.reduce((sum, c) => 
      sum + (c.montantTotal || c.prixConsultation || 0), 0);
    this.totalPaye = this.consultations
      .filter(c => c.statutPaiement === 'PAYE')
      .reduce((sum, c) => sum + (c.montantTotal || c.prixConsultation || 0), 0);
  }

  payerFacture(consultation: Consultation): void {
    if (!confirm(`Confirmer le paiement de ${this.formatMontant(consultation.montantTotal || consultation.prixConsultation)} ?`)) return;
    
    this.rdvService.updateStatutPaiement(consultation.id, 'PAYE').subscribe({
      next: () => {
        consultation.statutPaiement = 'PAYE';
        this.calculateTotals();
        alert('Paiement effectué avec succès !');
        
        if (confirm('Télécharger la facture PDF ?')) {
          this.telechargerFacture(consultation.id);
        }
      },
      error: (err) => {
        console.error('Erreur paiement:', err);
        alert('Erreur lors du paiement');
      }
    });
  }

  telechargerFacture(consultationId: number): void {
    this.rdvService.genererFacturePDF(consultationId).subscribe({
      next: (facture) => {
        console.log('Facture PDF générée:', facture);
        alert(`Facture N° ${facture.numeroFacture} prête au téléchargement`);
      },
      error: (err) => {
        console.error('Erreur génération PDF:', err);
        alert('Erreur lors de la génération du PDF');
      }
    });
  }

  voirFacture(consultationId: number): void {
    this.router.navigate(['/patient/facture', consultationId]);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(montant || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}