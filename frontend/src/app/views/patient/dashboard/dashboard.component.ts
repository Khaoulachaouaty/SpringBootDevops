import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RendezVousService } from '../../../services/rendezvous.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  user: any = null;
  prochainRdv: any = null;
  prochainsRdvs: any[] = [];
  consultationsCount = 0;
  facturesEnAttente = 0;
  loading = true;
  today: Date = new Date();  // ✅ AJOUTER CETTE LIGNE
  
  specialites = [
    { name: 'Cardiologie', icon: 'bi-heart-pulse', color: '#ef4444' },
    { name: 'Dermatologie', icon: 'bi-droplet', color: '#f59e0b' },
    { name: 'Pédiatrie', icon: 'bi-baby', color: '#10b981' },
    { name: 'Gynécologie', icon: 'bi-people', color: '#ec4899' },
    { name: 'Neurologie', icon: 'bi-brain', color: '#8b5cf6' },
    { name: 'Ophtalmologie', icon: 'bi-eye', color: '#3b82f6' },
    { name: 'Orthopédie', icon: 'bi-heart', color: '#06b6d4' },
    { name: 'Généraliste', icon: 'bi-person-badge', color: '#6b7280' }
  ];

  constructor(
    private authService: AuthService,
    private rdvService: RendezVousService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    // Charger les rendez-vous
    this.rdvService.getRendezVousByPatient(patientId).subscribe({
      next: (rdvs) => {
        const aujourdhui = new Date();
        const rdvsFuturs = rdvs.filter(rdv => new Date(rdv.date) >= aujourdhui && rdv.statut !== 'ANNULE')
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        this.prochainRdv = rdvsFuturs[0] || null;
        this.prochainsRdvs = rdvsFuturs.slice(0, 3);
        this.loading = false;
      },
      error: () => this.loading = false
    });

    // Charger les consultations
    this.rdvService.getConsultationsByPatient(patientId).subscribe({
      next: (consultations) => {
        this.consultationsCount = consultations.length;
        this.facturesEnAttente = consultations.filter(c => c.statutPaiement !== 'PAYE').length;
      }
    });
  }

  prendreRdv(): void {
    this.router.navigate(['/patient/prendre-rdv']);
  }

  voirRendezVous(): void {
    this.router.navigate(['/patient/rendezvous']);
  }

  voirDossier(): void {
    this.router.navigate(['/patient/dossier']);
  }

  voirPaiements(): void {
    this.router.navigate(['/patient/paiements']);
  }

  getInitials(): string {
    return (this.user?.prenom?.charAt(0) || '') + (this.user?.nom?.charAt(0) || '');
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
}