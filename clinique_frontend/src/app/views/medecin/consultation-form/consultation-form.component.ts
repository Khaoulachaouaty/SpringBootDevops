import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css']
})
export class ConsultationFormComponent implements OnInit {
  consultationForm: FormGroup;
  loading = false;
  saving = false;
  currentUserId: number | null = null;
  
  // Données du rendez-vous
  rdvId: number | null = null;
  patientId: number | null = null;
  patientNom = '';
  patientPrenom = '';
  rdvDate = '';
  rdvHeure = '';
  rdvMotif = '';
  
  // Montants calculés
  montantTotal = 0;
  
  // Étapes du wizard
  currentStep = 1;
  totalSteps = 4;
  
  // Consultation créée
  consultationCreee: any = null;

  constructor(
    private fb: FormBuilder,
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.consultationForm = this.fb.group({
      // Étape 1: Diagnostic
      diagnostic: ['', [Validators.required, Validators.minLength(10)]],
      notes: [''],
      
      // Étape 2: Traitement
      traitement: [''],
      ordonnance: [''],
      
      // Étape 3: Facturation
      prixConsultation: [50, [Validators.required, Validators.min(1)]],
      montantMedicaments: [0, [Validators.min(0)]],
      statutPaiement: ['EN_ATTENTE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getMedecinId();
    
    // Récupérer les paramètres de la route
    this.route.queryParams.subscribe(params => {
      this.rdvId = Number(params['rdvId']) || null;
      this.patientId = Number(params['patientId']) || null;
      this.patientNom = params['patientNom'] || '';
      this.patientPrenom = params['patientPrenom'] || '';
      this.rdvDate = params['date'] || '';
      this.rdvHeure = params['heure'] || '';
      this.rdvMotif = params['motif'] || '';
      
      if (!this.rdvId || !this.patientId) {
        alert('Erreur: Informations du rendez-vous manquantes');
        this.router.navigate(['/medecin/rendezvous']);
      }
    });
    
    // Calculer le total automatiquement
    this.consultationForm.valueChanges.subscribe(values => {
      this.montantTotal = (values.prixConsultation || 0) + (values.montantMedicaments || 0);
    });
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.charAt(0) || '') + (nom?.charAt(0) || '');
  }

  // ============ NAVIGATION WIZARD ============

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      let canProceed = true;
      
      if (this.currentStep === 1 && !this.consultationForm.get('diagnostic')?.valid) {
        canProceed = false;
        this.consultationForm.get('diagnostic')?.markAsTouched();
      }
      
      if (this.currentStep === 3 && !this.consultationForm.get('prixConsultation')?.valid) {
        canProceed = false;
        this.consultationForm.get('prixConsultation')?.markAsTouched();
      }
      
      if (canProceed) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStepValid(): boolean {
    if (this.currentStep === 1) {
      return this.consultationForm.get('diagnostic')?.valid || false;
    }
    if (this.currentStep === 3) {
      return this.consultationForm.get('prixConsultation')?.valid || false;
    }
    return true;
  }

  // ============ SAUVEGARDE ============

  saveConsultation(): void {
    if (!this.rdvId || !this.currentUserId) return;
    
    if (this.consultationForm.invalid) {
      this.consultationForm.markAllAsTouched();
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    this.saving = true;
    
    const consultationData: Partial<Consultation> = {
      diagnostic: this.consultationForm.value.diagnostic,
      ordonnance: this.consultationForm.value.ordonnance,
      traitement: this.consultationForm.value.traitement,
      notes: this.consultationForm.value.notes,
      prixConsultation: this.consultationForm.value.prixConsultation,
      montantMedicaments: this.consultationForm.value.montantMedicaments || 0,
      statutPaiement: this.consultationForm.value.statutPaiement
    };
    
    this.rdvService.createConsultation(this.rdvId, consultationData).subscribe({
      next: (consultation) => {
        this.consultationCreee = consultation;
        
        // Mettre à jour le statut du RDV
        this.rdvService.updateStatus(this.rdvId!, 'TERMINE', this.currentUserId!).subscribe({
          next: () => {
            this.saving = false;
            // Rediriger vers la facture
            this.router.navigate(['/medecin/facture', consultation.id]);
          },
          error: () => {
            this.saving = false;
            alert('Erreur lors de la mise à jour du statut');
          }
        });
      },
      error: (err) => {
        this.saving = false;
        console.error('Erreur création consultation:', err);
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  // ============ NAVIGATION ============

  voirDossierMedical(): void {
    this.router.navigate(['/medecin/dossiers'], {
      queryParams: {
        patientId: this.patientId,
        patientNom: `${this.patientPrenom} ${this.patientNom}`
      }
    });
  }

  voirFacture(): void {
    if (this.consultationCreee?.id) {
      this.router.navigate(['/medecin/facture', this.consultationCreee.id]);
    }
  }

  retourListeRdv(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }

  nouveauRdv(): void {
    this.router.navigate(['/medecin/rendezvous']);
  }

  // ============ HELPERS ============

  getProgressWidth(): string {
    return `${(this.currentStep / this.totalSteps) * 100}%`;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(montant);
  }
}