// app.component.ts
import { Component, computed, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './views/shared/navbar/navbar.component';
import { FooterComponent } from './views/shared/footer/footer.component';
import { AdminNavbarComponent } from './views/admin/admin-navbar/admin-navbar.component';
import { MedecinNavbarComponent } from './views/medecin/medecin-navbar/medecin-navbar.component';
import { AuthService } from './services/auth.service';
import { PatientNavbarComponent } from "./views/patient/patient-navbar/patient-navbar.component";
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent,
    AdminNavbarComponent,
    MedecinNavbarComponent,
    FooterComponent,
    PatientNavbarComponent
  ],
  templateUrl: './app.component.html',
  styles: [`:host { display: block; }`]
})
export class AppComponent implements OnInit, OnDestroy {
  
  private isWebSocketInitialized = false; // ✅ Éviter les doubles initialisations

  showPublicNavbar = computed(() => {
    const role = this.authService.userRole();
    const isLoggedIn = this.authService.isLoggedIn();
    return !isLoggedIn || role === null;
  });
  
  showAdminNavbar = computed(() => {
    return this.authService.userRole() === 'ADMIN';
  });
  
  showMedecinNavbar = computed(() => {
    return this.authService.userRole() === 'MEDECIN';
  });
  
  showPatientNavbar = computed(() => {
    return this.authService.userRole() === 'PATIENT';
  });
  
  showFooter = computed(() => {
    const url = this.currentUrl();
    const noFooterRoutes = ['/login', '/register'];
    return !noFooterRoutes.includes(url);
  });
  
  currentUrl = signal('/');

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl.set(event.urlAfterRedirects);
    });

    // ✅ Réagir aux changements de connexion
    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      const role = this.authService.userRole();
      
      if (isLoggedIn && (role === 'PATIENT' || role === 'MEDECIN')) {
        this.initWebSocketIfLoggedIn();
      } else {
        this.notificationService.closeWebSocket();
        this.isWebSocketInitialized = false;
      }
    });
  }

  ngOnInit(): void {
    this.initWebSocketIfLoggedIn();
    this.notificationService.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    this.notificationService.closeWebSocket();
  }

  private initWebSocketIfLoggedIn(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const role = this.authService.userRole();
    
    // ✅ Éviter les doubles initialisations
    if (this.isWebSocketInitialized) {
      console.log('WebSocket déjà initialisé, skip...');
      return;
    }
    
    if (isLoggedIn && (role === 'PATIENT' || role === 'MEDECIN')) {
      console.log('🔌 Initialisation WebSocket pour:', role);
      this.isWebSocketInitialized = true;
      this.notificationService.initWebSocket();
      
      // ✅ Démarrer le polling de secours
      if (role === 'PATIENT') {
        const patientId = this.authService.getPatientId();
        if (patientId) {
          console.log('🔄 Démarrage polling patient:', patientId);
          this.notificationService.startPollingPatient(patientId);
        }
      } else if (role === 'MEDECIN') {
        const medecinId = this.authService.getMedecinId();
        if (medecinId) {
          console.log('🔄 Démarrage polling médecin:', medecinId);
          this.notificationService.startPollingMedecin(medecinId);
        }
      }
      
      // Rafraîchir les notifications au démarrage
      setTimeout(() => {
        this.notificationService.refreshNotifications();
      }, 1000);
    }
  }
}