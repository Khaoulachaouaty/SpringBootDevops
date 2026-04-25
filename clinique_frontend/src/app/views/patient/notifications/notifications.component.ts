// notification-patient.component.ts
import { Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationResponse, NotificationStatut } from '../../../models/notification.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',  // ✅ CORRIGÉ
  styleUrls: ['./notifications.component.css']
})
export class NotificationPatientComponent implements OnInit, OnDestroy {

  @ViewChild('notificationDropdown') notificationDropdown!: ElementRef;

  isNotificationsOpen = false;
  unreadCount = 0;
  notifications: NotificationResponse[] = [];
  currentUserId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getPatientId();
    if (this.currentUserId) {
      console.log('🔔 NotificationPatientComponent - ID Patient:', this.currentUserId);
      
      // ✅ S'abonner aux observables pour les mises à jour temps réel
      this.notificationService.unreadCountPatient
        .pipe(takeUntil(this.destroy$))
        .subscribe(count => {
          console.log('📊 Mise à jour compteur patient:', count);
          this.unreadCount = count;
        });

      this.notificationService.notificationsPatient
        .pipe(takeUntil(this.destroy$))
        .subscribe(notifs => {
          console.log('📋 Mise à jour liste notifications patient:', notifs?.length || 0);
          this.notifications = notifs?.slice(0, 5) || [];
        });

      // Chargement initial
      this.loadNotifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    if (!this.currentUserId) return;
    
    console.log('🔄 Chargement manuel des notifications patient...');
    this.notificationService.getNotificationsByPatient(this.currentUserId).subscribe({
      next: () => console.log('✅ Notifications chargées'),
      error: (err) => console.error('❌ Erreur chargement:', err)
    });
    this.notificationService.getUnreadCountPatient(this.currentUserId).subscribe({
      next: (count) => console.log('✅ Compteur chargé:', count),
      error: (err) => console.error('❌ Erreur compteur:', err)
    });
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    
    if (this.isNotificationsOpen) {
      this.loadNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notificationDropdown?.nativeElement &&
        !this.notificationDropdown.nativeElement.contains(event.target)) {
      this.isNotificationsOpen = false;
    }
  }

  onNotificationClick(notification: NotificationResponse): void {
    if (notification.statut === NotificationStatut.NON_LUE && notification.id) {
      this.notificationService.markAsReadPatient(notification.id).subscribe();
    }
    
    this.redirectBasedOnType(notification);
    this.isNotificationsOpen = false;
  }

  redirectBasedOnType(notification: NotificationResponse): void {
    const type = notification.type;
    if (type === 'RAPPEL_RDV' || type === 'CONFIRMATION_RDV' || type === 'ANNULATION_PAR_MEDECIN') {
      this.router.navigate(['/patient/rendezvous']);
    } else if (type === 'FACTURE' || type === 'PAIEMENT_RECU') {
      this.router.navigate(['/patient/factures']);
    } else {
      this.router.navigate(['/patient/notifications']);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    if (!this.currentUserId) return;
    
    this.notificationService.markAllAsReadPatient(this.currentUserId).subscribe();
  }

  viewAllNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = false;
    this.router.navigate(['/patient/notifications']);
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'RAPPEL_RDV': 'bi-calendar-event-fill',
      'CONFIRMATION_RDV': 'bi-check-circle-fill',
      'ANNULATION_PAR_MEDECIN': 'bi-x-circle-fill',
      'FACTURE': 'bi-receipt',
      'PAIEMENT_RECU': 'bi-cash-coin'
    };
    return icons[type] || 'bi-bell-fill';
  }
}