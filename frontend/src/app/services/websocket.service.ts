// services/websocket.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationResponse } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private notificationSubject = new BehaviorSubject<NotificationResponse | null>(null);
  
  public notifications$ = this.notificationSubject.asObservable();
  
  private isConnected = false;
  private userId: number | null = null;
  private userRole: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(private authService: AuthService) {}

// services/websocket.service.ts - Version simplifiée

connect(): void {
  if (this.isConnected) {
    console.log('WebSocket déjà connecté');
    return;
  }

  this.userId = this.authService.getEffectiveId();
  this.userRole = this.authService.getCurrentRole();
  
  if (!this.userId || !this.userRole) {
    console.warn('⚠️ Impossible de se connecter au WebSocket');
    return;
  }

  if (this.userRole === 'ADMIN') {
    return;
  }

  console.log(`🔌 Connexion WebSocket pour ${this.userRole} ID: ${this.userId}`);

  // ✅ Utiliser SockJS pour plus de compatibilité
  const wsUrl = `ws://localhost:8082/clinique/ws-notifications/websocket`;
  this.ws = new WebSocket(wsUrl);

  this.ws.onopen = () => {
    console.log('✅ WebSocket connecté');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.sendSubscription();
  };

  this.ws.onerror = (error) => {
    console.error('❌ Erreur WebSocket:', error);
  };

  this.ws.onclose = () => {
    console.log('🔌 WebSocket déconnecté');
    this.isConnected = false;
    this.handleReconnect();
  };

  this.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('🔔 Message WebSocket reçu:', data);
      
      // ✅ Extraire la notification
      let notification = null;
      if (data.type === 'notification' && data.content) {
        notification = data.content;
      } else if (data.id && data.message) {
        notification = data;
      }
      
      if (notification) {
        console.log('🎯 Notification extraite, envoi au subject');
        this.notificationSubject.next(notification);
      }
    } catch (error) {
      console.error('Erreur parsing:', error);
    }
  };
}

  private sendSubscription(): void {
    if (!this.ws || !this.isConnected) return;
    
    // ✅ Abonnement STOMP
    const subscribeMsg = {
      type: 'SUBSCRIBE',
      destination: `/user/${this.userId}/queue/notifications`
    };
    console.log('📡 Envoi abonnement:', subscribeMsg);
    this.ws.send(JSON.stringify(subscribeMsg));
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  disconnect(): void {
    if (this.ws && this.isConnected) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  isConnectedToWebSocket(): boolean {
    return this.isConnected;
  }
}