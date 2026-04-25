import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RendezVousService } from '../../../services/rendezvous.service';
import { RendezVous } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-mes-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-patients.component.html',
  styleUrls: ['./mes-patients.component.css']
})
export class MesPatientsComponent implements OnInit {
  patients: any[] = [];
  loading = true;
  currentUserId: number | null = null;

  constructor(
    private authService: AuthService,
    private rdvService: RendezVousService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.loadPatients();
  }

  loadPatients(): void {
    if (!this.currentUserId) return;
    
    this.rdvService.getRendezVousByMedecin(this.currentUserId).subscribe({
      next: (rdvs: RendezVous[]) => {
        const patientMap = new Map();
        rdvs.forEach(rdv => {
          if (!patientMap.has(rdv.patientId)) {
            patientMap.set(rdv.patientId, {
              id: rdv.patientId,
              nom: rdv.patientNom,
              prenom: rdv.patientPrenom,
              email: rdv.patientEmail,
              tel: rdv.patientTel,
              dernierRdv: rdv.date,
              nbRdv: 1
            });
          } else {
            const patient = patientMap.get(rdv.patientId);
            patient.nbRdv++;
            if (new Date(rdv.date) > new Date(patient.dernierRdv)) {
              patient.dernierRdv = rdv.date;
            }
          }
        });
        this.patients = Array.from(patientMap.values());
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  viewDossier(patientId: number): void {
    this.router.navigate(['/medecin/dossiers'], { 
      queryParams: { patientId: patientId }
    });
  }

  nouveauRdv(patientId: number): void {
    // Redirection vers création RDV avec patient pré-sélectionné
    this.router.navigate(['/medecin/rendezvous'], {
      queryParams: { patientId: patientId, action: 'new' }
    });
  }
}