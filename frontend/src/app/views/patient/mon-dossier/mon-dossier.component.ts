// views/patient/mon-dossier/mon-dossier.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RendezVousService } from '../../../services/rendezvous.service';
import { Consultation, DossierMedicalResponse } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-mon-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mon-dossier.component.html',
  styleUrls: ['./mon-dossier.component.css']
})
export class MonDossierComponent implements OnInit {
  
  user: any = null;
  consultations: Consultation[] = [];
  dossierMedicalContent: string = '';  // Contenu du dossier médical (lecture seule)
  loading = false;
  activeTab: string = 'consultations';

  constructor(
    private authService: AuthService,
    private rdvService: RendezVousService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    this.loadConsultations();
    this.loadDossierMedical();
  }

  loadConsultations(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading = true;
    this.rdvService.getConsultationsByPatient(patientId).subscribe({
      next: (consultations) => {
        this.consultations = consultations.sort((a, b) => 
          new Date(b.dateConsultation || 0).getTime() - new Date(a.dateConsultation || 0).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement consultations:', err);
        this.loading = false;
      }
    });
  }

  // ✅ CORRIGÉ - Le patient consulte son propre dossier sans medecinId
  loadDossierMedical(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.rdvService.consulterMonDossierMedical(patientId).subscribe({
      next: (dossier: DossierMedicalResponse) => {
        this.dossierMedicalContent = dossier?.dossierMedical || '';
        console.log('Dossier médical chargé:', this.dossierMedicalContent);
      },
      error: (err) => {
        console.error('Erreur chargement dossier médical:', err);
        this.dossierMedicalContent = '';
      }
    });
  }

  payerFacture(consultation: Consultation): void {
    if (!confirm(`Confirmer le paiement de ${this.formatMontant(consultation.montantTotal || consultation.prixConsultation)} ?`)) return;
    
    this.rdvService.updateStatutPaiement(consultation.id, 'PAYE').subscribe({
      next: () => {
        consultation.statutPaiement = 'PAYE';
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
        alert(`Facture N° ${facture.numeroFacture} prête au téléchargement`);
      },
      error: (err) => {
        console.error('Erreur génération PDF:', err);
        alert('Erreur lors de la génération du PDF');
      }
    });
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.charAt(0) || '') + (nom?.charAt(0) || '');
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(montant || 0);
  }
}