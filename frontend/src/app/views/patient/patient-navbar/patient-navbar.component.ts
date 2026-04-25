import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationPatientComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-patient-navbar',
  standalone: true,
  imports: [CommonModule, NotificationPatientComponent],
  templateUrl: './patient-navbar.component.html',
  styleUrls: ['./patient-navbar.component.css']
})
export class PatientNavbarComponent {

  isMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateTo(path: string): void {
    this.isMenuOpen = false;
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}