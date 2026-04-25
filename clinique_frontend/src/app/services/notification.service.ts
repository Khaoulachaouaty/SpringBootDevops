// services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { 
  NotificationResponse, 
  NotificationRequest, 
  MessageResponse,
  NotificationStatut  // 🔥 IMPORTANT : importer l'enum
} from '../models/notification.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private readonly baseUrl = `${API_CONFIG.baseUrl}/notifications`;
  
  // BehaviorSubjects pour state management réactif
  private unreadCountPatient$ = new BehaviorSubject<number>(0);
  private unreadCountMedecin$ = new BehaviorSubject<number>(0);
  private notificationsPatient$ = new BehaviorSubject<NotificationResponse[]>([]);
  private notificationsMedecin$ = new BehaviorSubject<NotificationResponse[]>([]);

  // Observables publics
  public unreadCountPatient = this.unreadCountPatient$.asObservable();
  public unreadCountMedecin = this.unreadCountMedecin$.asObservable();
  public notificationsPatient = this.notificationsPatient$.asObservable();
  public notificationsMedecin = this.notificationsMedecin$.asObservable();

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {}

  // ==================== WEBSOCKET ====================

  initWebSocket(): void {
    this.webSocketService.connect();
    
    this.webSocketService.notifications$.subscribe(notification => {
      if (notification) {
        console.log('🎯 Nouvelle notification temps réel:', notification);
        this.handleRealtimeNotification(notification);
      }
    });
  }

  private handleRealtimeNotification(notification: NotificationResponse): void {
    const role = localStorage.getItem('userRole');
    
    if (role === 'PATIENT') {
      const currentCount = this.unreadCountPatient$.value;
      this.unreadCountPatient$.next(currentCount + 1);
      
      const currentNotifs = this.notificationsPatient$.value;
      this.notificationsPatient$.next([notification, ...currentNotifs]);
      
      this.showNotificationToast(notification);
      
    } else if (role === 'MEDECIN') {
      const currentCount = this.unreadCountMedecin$.value;
      this.unreadCountMedecin$.next(currentCount + 1);
      
      const currentNotifs = this.notificationsMedecin$.value;
      this.notificationsMedecin$.next([notification, ...currentNotifs]);
      
      this.showNotificationToast(notification);
    }
  }

  private showNotificationToast(notification: NotificationResponse): void {
    console.log(`🔔 [${notification.type}] ${notification.message}`);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Clinique - Nouvelle notification', {
        body: notification.message,
        icon: '/assets/icon.png'
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  closeWebSocket(): void {
    this.webSocketService.disconnect();
  }

  isWebSocketConnected(): boolean {
    return this.webSocketService.isConnectedToWebSocket();
  }

  // ==================== CRÉATION ====================
  
  createNotification(request: NotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, request);
  }

  // ==================== PATIENT ====================

  getNotificationsByPatient(patientId: number): Observable<NotificationResponse[]> {
    const url = `${this.baseUrl}/patient/${patientId}`;
    console.log('🚀 Récupération notifications patient:', url);
    
    return this.http.get<NotificationResponse[]>(url)
      .pipe(
        tap(notifs => this.notificationsPatient$.next(notifs))
      );
  }

  getUnreadNotificationsPatient(patientId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/patient/${patientId}/non-lues`);
  }

  getUnreadCountPatient(patientId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/patient/${patientId}/count-non-lues`)
      .pipe(
        tap(count => this.unreadCountPatient$.next(count))
      );
  }

  markAsReadPatient(notificationId: number): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.baseUrl}/${notificationId}/lue`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountPatient$.value;
          this.unreadCountPatient$.next(Math.max(0, currentCount - 1));
          
          const currentNotifs = this.notificationsPatient$.value;
          const updatedNotifs = currentNotifs.map(n => 
            n.id === notificationId ? { 
              ...n, 
              statut: NotificationStatut.LUE,  // 🔥 Utiliser l'enum
              dateLecture: new Date().toISOString() 
            } : n
          );
          this.notificationsPatient$.next(updatedNotifs);
        })
      );
  }

  markAllAsReadPatient(patientId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/patient/${patientId}/tout-lire`, {})
      .pipe(
        tap(() => {
          this.unreadCountPatient$.next(0);
          const currentNotifs = this.notificationsPatient$.value;
          const updatedNotifs = currentNotifs.map(n => ({ 
            ...n, 
            statut: NotificationStatut.LUE,  // 🔥 Utiliser l'enum
            dateLecture: new Date().toISOString() 
          }));
          this.notificationsPatient$.next(updatedNotifs);
        })
      );
  }

  // ==================== MÉDECIN ====================

  getNotificationsByMedecin(medecinId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/medecin/${medecinId}`)
      .pipe(
        tap(notifs => this.notificationsMedecin$.next(notifs))
      );
  }

  getUnreadNotificationsMedecin(medecinId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/medecin/${medecinId}/non-lues`);
  }

  getUnreadCountMedecin(medecinId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/medecin/${medecinId}/count-non-lues`)
      .pipe(
        tap(count => this.unreadCountMedecin$.next(count))
      );
  }

  markAsReadMedecin(notificationId: number): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.baseUrl}/${notificationId}/lue`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountMedecin$.value;
          this.unreadCountMedecin$.next(Math.max(0, currentCount - 1));
          
          const currentNotifs = this.notificationsMedecin$.value;
          const updatedNotifs = currentNotifs.map(n => 
            n.id === notificationId ? { 
              ...n, 
              statut: NotificationStatut.LUE,  // 🔥 Utiliser l'enum
              dateLecture: new Date().toISOString() 
            } : n
          );
          this.notificationsMedecin$.next(updatedNotifs);
        })
      );
  }

  markAllAsReadMedecin(medecinId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/medecin/${medecinId}/tout-lire`, {})
      .pipe(
        tap(() => {
          this.unreadCountMedecin$.next(0);
          const currentNotifs = this.notificationsMedecin$.value;
          const updatedNotifs = currentNotifs.map(n => ({ 
            ...n, 
            statut: NotificationStatut.LUE,  // 🔥 Utiliser l'enum
            dateLecture: new Date().toISOString() 
          }));
          this.notificationsMedecin$.next(updatedNotifs);
        })
      );
  }

  // ==================== POLLING AUTO (FALLBACK) ====================

startPollingPatient(patientId: number): void {
  console.log('🔄 Démarrage polling patient toutes les 30 secondes');
  interval(30000).subscribe(() => {
    console.log('📡 Polling patient...');
    this.getUnreadCountPatient(patientId).subscribe();
    this.getNotificationsByPatient(patientId).subscribe();
  });
}

  startPollingMedecin(medecinId: number, intervalMs: number = 30000): Observable<number> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getUnreadCountMedecin(medecinId)),
      catchError(err => {
        console.error('Erreur polling notifications médecin:', err);
        return this.unreadCountMedecin$;
      })
    );
  }

  // ==================== SIMULATION (DEV) ====================

  simulerRappels(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/simuler/rappels`, {});
  }

  // ==================== HELPERS ====================

  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      'NOUVEAU_RDV': 'event_available',
      'CONFIRMATION_RDV': 'check_circle',
      'ANNULATION_PAR_PATIENT': 'cancel',
      'ANNULATION_PAR_MEDECIN': 'cancel',
      'MODIFICATION_PAR_PATIENT': 'edit',
      'RAPPEL_RDV': 'alarm',
      'DEMANDE_EN_ATTENTE': 'hourglass_empty',
      'FACTURE': 'receipt',
      'PAIEMENT_RECU': 'payments'
    };
    return icons[type] || 'notifications';
  }

  getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      'NOUVEAU_RDV': 'primary',
      'CONFIRMATION_RDV': 'success',
      'ANNULATION_PAR_PATIENT': 'warn',
      'ANNULATION_PAR_MEDECIN': 'warn',
      'MODIFICATION_PAR_PATIENT': 'accent',
      'RAPPEL_RDV': 'accent',
      'DEMANDE_EN_ATTENTE': 'warning',
      'FACTURE': 'primary',
      'PAIEMENT_RECU': 'success'
    };
    return colors[type] || 'default';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshNotifications(): void {
    const role = localStorage.getItem('userRole');
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (role === 'PATIENT' && userId.patientId) {
      this.getNotificationsByPatient(userId.patientId).subscribe();
      this.getUnreadCountPatient(userId.patientId).subscribe();
    } else if (role === 'MEDECIN' && userId.medecinId) {
      this.getNotificationsByMedecin(userId.medecinId).subscribe();
      this.getUnreadCountMedecin(userId.medecinId).subscribe();
    }
  }


  
}