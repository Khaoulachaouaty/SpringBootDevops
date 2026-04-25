import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const authStub = {
      userRole: signal<string | null>(null),
      isLoggedIn: signal(false),
      getPatientId: () => null,
      getMedecinId: () => null,
    };
    const notifStub = {
      initWebSocket: () => {},
      closeWebSocket: () => {},
      requestNotificationPermission: () => {},
      refreshNotifications: () => {},
      startPollingPatient: () => {},
      startPollingMedecin: () => {},
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotificationService, useValue: notifStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hide admin/medecin/patient navbars when not logged in', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.showAdminNavbar()).toBeFalse();
    expect(app.showMedecinNavbar()).toBeFalse();
    expect(app.showPatientNavbar()).toBeFalse();
    expect(app.showPublicNavbar()).toBeTrue();
  });
});
