import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Patient } from '../../../models/patient.model';
import { Medecin } from '../../../models/medecin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  patients: Patient[] = [];
  medecins: Medecin[] = [];
  loading = true;

  // Statistiques calculées
  stats = {
    totalPatients: 0,
    totalMedecins: 0,
    totalSpecialites: 0,
    rdvAujourdhui: 0, // À implémenter plus tard
    nouveauxPatientsMois: 0, // À implémenter
    tauxOccupation: 0 // À implémenter
  };

  // Données pour le graphique (simulation)
  rdvParMois = [45, 52, 48, 65, 72, 68, 75, 82, 78, 85, 92, 88];
  mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getAllPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.stats.totalPatients = data.length;
        this.calculateStats();
      },
      error: () => this.loading = false
    });

    this.apiService.getAllMedecins().subscribe({
      next: (data) => {
        this.medecins = data;
        this.stats.totalMedecins = data.length;
        this.stats.totalSpecialites = this.countUniqueSpecialites(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private countUniqueSpecialites(medecins: Medecin[]): number {
    const specialites = new Set(medecins.map(m => m.specialite));
    return specialites.size;
  }

  private calculateStats(): void {
    // Simulation - à remplacer par vraies données backend
    this.stats.nouveauxPatientsMois = Math.floor(this.patients.length * 0.15);
    this.stats.tauxOccupation = Math.min(85, this.stats.totalMedecins * 5);
  }

  // Grouper médecins par spécialité pour le graphique
  getMedecinsParSpecialite(): {specialite: string, count: number}[] {
    const map = new Map<string, number>();
    this.medecins.forEach(m => {
      map.set(m.specialite, (map.get(m.specialite) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([specialite, count]) => ({specialite, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}