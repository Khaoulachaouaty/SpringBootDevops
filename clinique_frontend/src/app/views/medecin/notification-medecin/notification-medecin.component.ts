// notification-medecin.component.ts
import { Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationResponse, NotificationStatut } from '../../../models/notification.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-medecin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-medecin.component.html',
  styleUrls: ['./notification-medecin.component.css']
})
export class NotificationMedecinComponent implements OnInit, OnDestroy {

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
    this.currentUserId = this.authService.getMedecinId();
    if (this.currentUserId) {
      console.log('🔔 Notification Component - ID Médecin:', this.currentUserId);
      
      // ✅ S'abonner aux changements du compteur
      this.notificationService.unreadCountMedecin
        .pipe(takeUntil(this.destroy$))
        .subscribe(count => {
          console.log('📊 Compteur mis à jour:', count);
          this.unreadCount = count;
        });

      // ✅ S'abonner aux changements de la liste
      this.notificationService.notificationsMedecin
        .pipe(takeUntil(this.destroy$))
        .subscribe(notifs => {
          console.log('📋 Liste notifications mise à jour:', notifs?.length);
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
    
    console.log('🔄 Chargement initial des notifications...');
    this.notificationService.getNotificationsByMedecin(this.currentUserId).subscribe();
    this.notificationService.getUnreadCountMedecin(this.currentUserId).subscribe();
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    
    if (this.isNotificationsOpen) {
      // Recharger au moment de l'ouverture
      this.notificationService.getNotificationsByMedecin(this.currentUserId!).subscribe();
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
      this.notificationService.markAsReadMedecin(notification.id).subscribe();
    }
    
    this.redirectBasedOnType(notification);
    this.isNotificationsOpen = false;
  }

  redirectBasedOnType(notification: NotificationResponse): void {
    const type = notification.type;
    if (type === 'RAPPEL_RDV' || type === 'NOUVEAU_RDV' || 
        type === 'ANNULATION_PAR_PATIENT' || type === 'ANNULATION_PAR_MEDECIN' || 
        type === 'CONFIRMATION_RDV') {
      this.router.navigate(['/medecin/rendezvous']);
    } else if (type === 'FACTURE' || type === 'PAIEMENT_RECU') {
      this.router.navigate(['/medecin/dashboard']);
    } else {
      this.router.navigate(['/medecin/notifications']);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    if (!this.currentUserId) return;
    
    this.notificationService.markAllAsReadMedecin(this.currentUserId).subscribe();
  }

  viewAllNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationsOpen = false;
    this.router.navigate(['/medecin/notifications']);
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'NOUVEAU_RDV': 'bi-calendar-plus-fill',
      'CONFIRMATION_RDV': 'bi-check-circle-fill',
      'ANNULATION_PAR_PATIENT': 'bi-x-circle-fill',
      'ANNULATION_PAR_MEDECIN': 'bi-x-circle-fill',
      'RAPPEL_RDV': 'bi-clock-fill',
      'FACTURE': 'bi-receipt',
      'PAIEMENT_RECU': 'bi-cash-coin'
    };
    return icons[type] || 'bi-bell-fill';
  }
}