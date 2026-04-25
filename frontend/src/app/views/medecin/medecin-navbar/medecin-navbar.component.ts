// src/app/views/medecin/medecin-navbar/medecin-navbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationMedecinComponent } from "../notification-medecin/notification-medecin.component";

@Component({
  selector: 'app-medecin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationMedecinComponent],
  templateUrl: './medecin-navbar.component.html',
  styleUrls: ['./medecin-navbar.component.css']
})
export class MedecinNavbarComponent {

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