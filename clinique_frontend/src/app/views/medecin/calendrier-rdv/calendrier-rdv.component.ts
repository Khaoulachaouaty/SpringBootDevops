// calendrier-rdv.component.ts

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RendezVousService } from '../../../services/rendezvous.service';
import { AuthService } from '../../../services/auth.service';
import { RendezVous, CalendarEvent, RendezVousStatus } from '../../../models/rendezvous.model';

declare var bootstrap: any;

@Component({
  selector: 'app-calendrier-rdv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendrier-rdv.component.html',
  styleUrls: ['./calendrier-rdv.component.css']
})
export class CalendrierRdvComponent implements OnInit, AfterViewInit {
  
  // ==================== PROPRIÉTÉS ====================
  
  rendezVous: RendezVous[] = [];
  allRendezVous: RendezVous[] = [];
  selectedDate: Date = new Date();
  currentMonth: Date = new Date();
  weekDays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  calendarDays: Date[] = [];
  loading = false;
  currentUserId: number | null = null;
  selectedRdv: RendezVous | null = null;
  selectedRdvToCancel: RendezVous | null = null;
  selectedRdvToMarkNoShow: RendezVous | null = null;
  
  // Formulaire consultation
  showConsultationForm = false;
  savingConsultation = false;
  consultationForm = {
    diagnostic: '',
    ordonnance: '',
    traitement: '',
    notes: '',
    prixConsultation: 50,
    montantMedicaments: 0,
    statutPaiement: 'EN_ATTENTE' as 'EN_ATTENTE' | 'PAYE'
  };
  
  Math = Math;

  // Modals
  private cancelModal: any;
  private noShowModal: any;
  private notificationToast: any;

  constructor(
    private rdvService: RendezVousService,
    private authService: AuthService,
    private router: Router
  ) {}

  // ==================== INITIALISATION ====================
  
  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.generateCalendar();
    this.loadAllRendezVous();
  }

  ngAfterViewInit(): void {
    this.initModals();
  }

  private initModals(): void {
    const modalElement = document.getElementById('cancelModal');
    if (modalElement && typeof bootstrap !== 'undefined') {
      this.cancelModal = new bootstrap.Modal(modalElement);
    }
    
    const noShowModalElement = document.getElementById('noShowModal');
    if (noShowModalElement && typeof bootstrap !== 'undefined') {
      this.noShowModal = new bootstrap.Modal(noShowModalElement);
    }
    
    const toastElement = document.getElementById('notificationToast');
    if (toastElement && typeof bootstrap !== 'undefined') {
      this.notificationToast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
      });
    }
  }

  // ==================== CALENDRIER ====================
  
  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.calendarDays.push(date);
    }
  }

  previousMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendar();
    this.loadAllRendezVous();
  }

  nextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendar();
    this.loadAllRendezVous();
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.loadRendezVous();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  loadAllRendezVous(): void {
    if (!this.currentUserId) return;
    
    this.loading = true;
    const startDate = this.getStartOfMonth();
    const endDate = this.getEndOfMonth();
    
    this.rdvService.getCalendarEvents(this.currentUserId, startDate, endDate).subscribe({
      next: (events: CalendarEvent[]) => {
        this.allRendezVous = events.map(event => ({
          id: event.id,
          date: event.start.split('T')[0],
          heure: event.start.split('T')[1]?.substring(0, 5) || '00:00',
          motif: event.motif || 'Consultation',
          statut: (event.status as RendezVousStatus) || 'CONFIRME',
          patientId: event.patientId,
          patientNom: event.patientNom || '',
          patientPrenom: '',
          patientEmail: '',
          patientTel: '',
          medecinId: 0,
          medecinNom: '',
          medecinPrenom: '',
          medecinSpecialite: ''
        } as RendezVous));
        
        this.loading = false;
        this.loadRendezVous();
      },
      error: (err) => {
        console.error('Erreur chargement RDV:', err);
        this.loadAllRendezVousAlternative();
      }
    });
  }

  loadAllRendezVousAlternative(): void {
    if (!this.currentUserId) return;
    
    this.rdvService.getRendezVousByMedecin(this.currentUserId).subscribe({
      next: (rdvs: RendezVous[]) => {
        this.allRendezVous = rdvs.filter(rdv => {
          const dateRdv = new Date(rdv.date);
          return dateRdv.getMonth() === this.currentMonth.getMonth() &&
                 dateRdv.getFullYear() === this.currentMonth.getFullYear() &&
                 rdv.statut !== 'ANNULE';
        });
        this.loadRendezVous();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement alternatif:', err);
        this.loading = false;
      }
    });
  }

  loadRendezVous(): void {
    if (!this.currentUserId) return;
    
    const dateStr = this.formatDate(this.selectedDate);
    this.rendezVous = this.allRendezVous.filter(rdv => rdv.date === dateStr);
    this.rendezVous.sort((a, b) => a.heure.localeCompare(b.heure));
  }

  // ==================== MÉTHODES UTILITAIRES ====================
  
  getStartOfMonth(): string {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const start = new Date(year, month, 1);
    return this.formatDate(start);
  }

  getEndOfMonth(): string {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const end = new Date(year, month + 1, 0);
    return this.formatDate(end);
  }

  getRdvCount(date: Date): number {
    const dateStr = this.formatDate(date);
    return this.allRendezVous.filter(rdv => rdv.date === dateStr).length;
  }

  hasRdv(date: Date): boolean {
    const dateStr = this.formatDate(date);
    return this.allRendezVous.some(rdv => rdv.date === dateStr);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date: Date): boolean {
    return date.toDateString() === this.selectedDate.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ==================== STATISTIQUES ====================
  
  getConfirmedCount(): number {
    if (!this.rendezVous || this.rendezVous.length === 0) return 0;
    return this.rendezVous.filter(rdv => rdv.statut === 'CONFIRME').length;
  }

  getPendingCount(): number {
    if (!this.rendezVous || this.rendezVous.length === 0) return 0;
    return this.rendezVous.filter(rdv => rdv.statut === 'EN_ATTENTE').length;
  }

  getCompletedCount(): number {
    if (!this.rendezVous || this.rendezVous.length === 0) return 0;
    return this.rendezVous.filter(rdv => rdv.statut === 'TERMINE').length;
  }

  getNoShowCount(): number {
    if (!this.rendezVous || this.rendezVous.length === 0) return 0;
    return this.rendezVous.filter(rdv => rdv.statut === 'NON_VENU').length;
  }

  // ==================== VÉRIFICATIONS DE DATE ====================
  
  isRdvPassed(rdv: RendezVous): boolean {
    const maintenant = new Date();
    const [annee, mois, jour] = rdv.date.split('-').map(Number);
    const [heure, minute] = rdv.heure.split(':').map(Number);
    const dateRdv = new Date(annee, mois - 1, jour, heure, minute);
    return dateRdv <= maintenant;
  }

  isRdvFuture(rdv: RendezVous): boolean {
    const maintenant = new Date();
    const [annee, mois, jour] = rdv.date.split('-').map(Number);
    const [heure, minute] = rdv.heure.split(':').map(Number);
    const dateRdv = new Date(annee, mois - 1, jour, heure, minute);
    return dateRdv > maintenant;
  }

  // ✅ CORRECTION : Utilisation de !== au lieu de === pour les comparaisons
  canCompleteRdv(rdv: RendezVous): boolean {
    // Exclure les statuts qui ne peuvent pas être terminés
    if (rdv.statut !== 'CONFIRME') return false;
    if (!this.isRdvPassed(rdv)) return false;
    return true;
  }

  canConfirmRdv(rdv: RendezVous): boolean {
    // Uniquement pour les RDV en attente et futurs
    if (rdv.statut !== 'EN_ATTENTE') return false;
    if (!this.isRdvFuture(rdv)) return false;
    return true;
  }

  canCancelRdv(rdv: RendezVous): boolean {
    // Ne peut pas annuler si déjà terminé, annulé ou non venu
    if (rdv.statut === 'TERMINE') return false;
    if (rdv.statut === 'ANNULE') return false;
    if (rdv.statut === 'NON_VENU') return false;
    if (!this.isRdvFuture(rdv)) return false;
    return true;
  }

  canMarkAsNoShow(rdv: RendezVous): boolean {
    // Uniquement pour les RDV confirmés et passés
    if (rdv.statut !== 'CONFIRME') return false;
    if (!this.isRdvPassed(rdv)) return false;
    return true;
  }

  showActions(rdv: RendezVous): boolean {
    // Afficher les actions seulement pour les RDV en attente ou confirmés
    return rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';
  }

  getRdvStatusMessage(rdv: RendezVous): string {
    const maintenant = new Date();
    const [annee, mois, jour] = rdv.date.split('-').map(Number);
    const [heure, minute] = rdv.heure.split(':').map(Number);
    const dateRdv = new Date(annee, mois - 1, jour, heure, minute);
    
    if (rdv.statut === 'CONFIRME' && dateRdv > maintenant) {
      const diffJours = Math.ceil((dateRdv.getTime() - maintenant.getTime()) / (1000 * 3600 * 24));
      if (diffJours === 0) return `Aujourd'hui à ${rdv.heure}`;
      if (diffJours === 1) return `Demain à ${rdv.heure}`;
      return `Dans ${diffJours} jours`;
    }
    
    if (rdv.statut === 'CONFIRME' && dateRdv <= maintenant) {
      return 'Consultation à valider';
    }
    
    if (rdv.statut === 'EN_ATTENTE') {
      return 'En attente de confirmation';
    }
    
    if (rdv.statut === 'NON_VENU') {
      return 'Patient non présent';
    }
    
    return '';
  }

  // ==================== ACTIONS SUR LES RDV ====================
  
  confirmRdv(rdv: RendezVous): void {
    const medecinId = this.authService.getCurrentUserId();
    if (!medecinId) return;
    
    this.rdvService.updateStatus(rdv.id, 'CONFIRME', medecinId).subscribe({
      next: (updated) => {
        rdv.statut = updated.statut;
        const index = this.allRendezVous.findIndex(r => r.id === rdv.id);
        if (index !== -1) this.allRendezVous[index].statut = updated.statut;
        this.loadRendezVous();
        this.showNotification('success', 'Rendez-vous confirmé avec succès');
      },
      error: (err) => {
        console.error('Erreur confirmation:', err);
        this.showNotification('error', 'Erreur lors de la confirmation');
      }
    });
  }

  openCancelModal(rdv: RendezVous): void {
    if (!this.canCancelRdv(rdv)) {
      this.showNotification('error', 'Ce rendez-vous ne peut plus être annulé');
      return;
    }
    this.selectedRdvToCancel = rdv;
    if (this.cancelModal) {
      this.cancelModal.show();
    } else {
      if (confirm(`Annuler le rendez-vous avec ${rdv.patientPrenom} ${rdv.patientNom} à ${rdv.heure} ?`)) {
        this.confirmCancel();
      }
    }
  }

  confirmCancel(): void {
    if (!this.selectedRdvToCancel) return;
    
    const medecinId = this.authService.getCurrentUserId();
    if (!medecinId) return;
    
    this.rdvService.updateStatus(this.selectedRdvToCancel.id, 'ANNULE', medecinId).subscribe({
      next: (updated) => {
        if (this.cancelModal) this.cancelModal.hide();
        
        this.selectedRdvToCancel!.statut = updated.statut;
        const index = this.allRendezVous.findIndex(r => r.id === this.selectedRdvToCancel!.id);
        if (index !== -1) this.allRendezVous[index].statut = updated.statut;
        this.loadRendezVous();
        
        this.showNotification('success', 'Rendez-vous annulé avec succès');
        this.selectedRdvToCancel = null;
      },
      error: (err) => {
        console.error('Erreur annulation:', err);
        this.showNotification('error', 'Erreur lors de l\'annulation');
        if (this.cancelModal) this.cancelModal.hide();
        this.selectedRdvToCancel = null;
      }
    });
  }

  openNoShowModal(rdv: RendezVous): void {
    if (!this.canMarkAsNoShow(rdv)) {
      this.showNotification('error', 'Ce rendez-vous ne peut pas être marqué comme non venu');
      return;
    }
    this.selectedRdvToMarkNoShow = rdv;
    if (this.noShowModal) {
      this.noShowModal.show();
    }
  }

  confirmNoShow(): void {
    if (!this.selectedRdvToMarkNoShow) return;
    
    const medecinId = this.authService.getCurrentUserId();
    if (!medecinId) return;
    
    this.rdvService.updateStatus(this.selectedRdvToMarkNoShow.id, 'NON_VENU', medecinId).subscribe({
      next: (updated) => {
        if (this.noShowModal) this.noShowModal.hide();
        
        this.selectedRdvToMarkNoShow!.statut = updated.statut;
        const index = this.allRendezVous.findIndex(r => r.id === this.selectedRdvToMarkNoShow!.id);
        if (index !== -1) this.allRendezVous[index].statut = updated.statut;
        this.loadRendezVous();
        
        this.showNotification('warning', 'Patient marqué comme non venu');
        this.selectedRdvToMarkNoShow = null;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.showNotification('error', 'Erreur lors de la mise à jour');
        if (this.noShowModal) this.noShowModal.hide();
        this.selectedRdvToMarkNoShow = null;
      }
    });
  }

  completeRdv(rdv: RendezVous): void {
    if (!this.canCompleteRdv(rdv)) {
      this.showNotification('error', 'Ce rendez-vous ne peut pas encore être terminé');
      return;
    }
    
    // Navigate to consultation-form page with query parameters
    this.router.navigate(['/medecin/consultation/new'], {
      queryParams: {
        rdvId: rdv.id,
        patientId: rdv.patientId,
        patientNom: rdv.patientNom,
        patientPrenom: rdv.patientPrenom,
        date: rdv.date,
        heure: rdv.heure,
        motif: rdv.motif
      }
    });
  }

  submitConsultation(): void {
    if (!this.selectedRdv || !this.currentUserId) return;
    
    // Validation
    if (!this.consultationForm.diagnostic.trim()) {
      alert('Le diagnostic est obligatoire');
      return;
    }

    this.savingConsultation = true;

    // 1. Créer la consultation
    const consultationData = {
      diagnostic: this.consultationForm.diagnostic,
      ordonnance: this.consultationForm.ordonnance,
      traitement: this.consultationForm.traitement,
      notes: this.consultationForm.notes,
      prixConsultation: this.consultationForm.prixConsultation,
      montantMedicaments: this.consultationForm.montantMedicaments,
      statutPaiement: this.consultationForm.statutPaiement as 'EN_ATTENTE' | 'PAYE'
    };

    this.rdvService.createConsultation(this.selectedRdv.id, consultationData).subscribe({
      next: (consultation) => {
        // 2. Mettre à jour le statut du RDV
        this.rdvService.updateStatus(this.selectedRdv!.id, 'TERMINE', this.currentUserId!).subscribe({
          next: (updated) => {
            this.selectedRdv!.statut = updated.statut;
            const index = this.allRendezVous.findIndex(r => r.id === this.selectedRdv!.id);
            if (index !== -1) this.allRendezVous[index].statut = updated.statut;
            
            this.savingConsultation = false;
            this.closeConsultationForm();
            this.loadRendezVous();
            
            this.showNotification('success', 'Consultation enregistrée et facture générée');
          },
          error: (err) => {
            console.error('Erreur mise à jour statut:', err);
            this.savingConsultation = false;
            this.showNotification('error', 'Erreur lors de la mise à jour du statut');
          }
        });
      },
      error: (err) => {
        console.error('Erreur création consultation:', err);
        this.savingConsultation = false;
        this.showNotification('error', 'Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  closeConsultationForm(): void {
    this.showConsultationForm = false;
    this.selectedRdv = null;
  }

  getMontantTotal(): number {
    return (this.consultationForm.prixConsultation || 0) + (this.consultationForm.montantMedicaments || 0);
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.charAt(0) || '') + (nom?.charAt(0) || '');
  }

  // ==================== NOTIFICATIONS ====================
  
  private showNotification(type: 'success' | 'error' | 'warning', message: string): void {
    const toastElement = document.getElementById('notificationToast');
    if (toastElement) {
      const iconElement = toastElement.querySelector('.toast-icon');
      const bodyElement = toastElement.querySelector('.toast-body');
      const titleElement = toastElement.querySelector('.toast-header strong');
      
      if (iconElement) {
        iconElement.className = `toast-icon ${type}`;
        if (type === 'success') iconElement.innerHTML = '<i class="bi bi-check-lg"></i>';
        if (type === 'error') iconElement.innerHTML = '<i class="bi bi-x-lg"></i>';
        if (type === 'warning') iconElement.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
      }
      
      if (titleElement) {
        if (type === 'success') titleElement.textContent = 'Succès';
        if (type === 'error') titleElement.textContent = 'Erreur';
        if (type === 'warning') titleElement.textContent = 'Attention';
      }
      
      if (bodyElement) {
        bodyElement.textContent = message;
      }
      
      if (this.notificationToast) {
        this.notificationToast.show();
      }
    } else {
      alert(message);
    }
  }

  // ==================== STYLES ET LABELS ====================
  
  getStatusClass(statut: RendezVousStatus): string {
    switch (statut) {
      case 'CONFIRME': return 'status-confirme';
      case 'EN_ATTENTE': return 'status-en-attente';
      case 'ANNULE': return 'status-annule';
      case 'TERMINE': return 'status-termine';
      case 'NON_VENU': return 'status-non-venu';
      default: return '';
    }
  }

  getStatusLabel(statut: RendezVousStatus): string {
    switch (statut) {
      case 'CONFIRME': return 'Confirmé';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULE': return 'Annulé';
      case 'TERMINE': return 'Terminé';
      case 'NON_VENU': return 'Non venu';
      default: return statut;
    }
  }
}