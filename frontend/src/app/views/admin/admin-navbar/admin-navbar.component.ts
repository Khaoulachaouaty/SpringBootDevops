// views/admin/admin-navbar/admin-navbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule], // 🔥 Retirer RouterLink et RouterLinkActive
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css']
})
export class AdminNavbarComponent {
  isMenuOpen = false;

  constructor(public authService: AuthService, private router: Router) {}

  navigateTo(path: string): void {
    this.isMenuOpen = false;
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}