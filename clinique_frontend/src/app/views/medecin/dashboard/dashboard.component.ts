// src/app/views/medecin/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { RendezVous, Consultation, CalendarEvent } from '../../../models/rendezvous.model';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  today = new Date();
  loading = false;
  todayRendezVous: RendezVous[] = [];
  recentNotifications: any[] = [];
  currentUserId: number | null = null;
  
  stats = {
    rdvToday: 0,
    rdvPending: 0,
    totalPatients: 0,
    totalConsultations: 0
  };

  constructor(
    private rdvService: RendezVousService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getMedecinId();
    if (this.currentUserId) {
      this.loadTodayRendezVous();
      this.loadStats();
      this.loadRecentNotifications();
    }
  }

  loadTodayRendezVous(): void {
    if (!this.currentUserId) return;
    
    this.loading = true;
    const todayStr = this.formatDate(this.today);
    
    this.rdvService.getRendezVousDuJour(this.currentUserId, todayStr).subscribe({
      next: (rdvs) => {
        this.todayRendezVous = rdvs.sort((a, b) => a.heure.localeCompare(b.heure));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement RDV:', err);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    if (!this.currentUserId) return;
    
    // RDV en attente
    this.rdvService.getRendezVousByMedecin(this.currentUserId).subscribe({
      next: (rdvs) => {
        this.stats.rdvPending = rdvs.filter(r => r.statut === 'EN_ATTENTE').length;
        this.stats.rdvToday = this.todayRendezVous.length;
        
        // Patients uniques
        const uniquePatients = new Set(rdvs.map(r => r.patientId));
        this.stats.totalPatients = uniquePatients.size;
      }
    });

    // Consultations
    this.rdvService.getConsultationsByMedecin(this.currentUserId).subscribe({
      next: (consultations) => {
        this.stats.totalConsultations = consultations.length;
      }
    });
  }

  loadRecentNotifications(): void {
    if (!this.currentUserId) return;
    
    this.notificationService.getNotificationsByMedecin(this.currentUserId).subscribe({
      next: (notifs) => {
        this.recentNotifications = notifs.slice(0, 3);
      }
    });
  }

  confirmRdv(rdv: RendezVous): void {
    if (!this.currentUserId) return;
    
    this.rdvService.updateStatus(rdv.id, 'CONFIRME', this.currentUserId).subscribe({
      next: (updated) => {
        rdv.statut = updated.statut;
        this.loadStats();
      },
      error: (err) => console.error('Erreur confirmation:', err)
    });
  }

  markAsDone(rdv: RendezVous): void {
    if (!this.currentUserId) return;
    
    if (confirm(`Confirmer que ${rdv.patientPrenom} ${rdv.patientNom} est venu et terminer le rendez-vous ?`)) {
      this.rdvService.updateStatus(rdv.id, 'TERMINE', this.currentUserId).subscribe({
        next: (updated) => {
          rdv.statut = updated.statut;
          // Redirection vers la consultation/facture
          this.router.navigate(['/medecin/dossiers'], {
            queryParams: {
              patientId: rdv.patientId,
              rdvId: rdv.id,
              action: 'consultation'
            }
          });
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  markAsNoShow(rdv: RendezVous): void {
    if (!this.currentUserId) return;
    
    if (confirm(`Marquer ${rdv.patientPrenom} ${rdv.patientNom} comme "Non venu" ?`)) {
      this.rdvService.updateStatus(rdv.id, 'NON_VENU', this.currentUserId).subscribe({
        next: (updated) => {
          rdv.statut = updated.statut;
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'CONFIRME': return 'success';
      case 'EN_ATTENTE': return 'warning';
      case 'ANNULE': return 'danger';
      case 'TERMINE': return 'secondary';
      case 'NON_VENU': return 'dark';
      default: return 'info';
    }
  }

  getStatusColor(statut: string): string {
    switch (statut) {
      case 'CONFIRME': return '#198754';
      case 'EN_ATTENTE': return '#ffc107';
      case 'ANNULE': return '#dc3545';
      case 'TERMINE': return '#6c757d';
      case 'NON_VENU': return '#212529';
      default: return '#0dcaf0';
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
