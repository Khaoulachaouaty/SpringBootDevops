// guards/medecin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const medecinGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']); // 🔥 LOGIN
    return false;
  }

  const role = authService.getCurrentRole();
  const normalizedRole = role?.replace('ROLE_', '');

  if (normalizedRole === 'MEDECIN' || role === 'MEDECIN') {
    return true;
  }

  // Redirection
  const routes: { [key: string]: string } = {
    'ADMIN': '/admin/dashboard',
    'PATIENT': '/patient/dashboard'
  };
  
  router.navigate([routes[normalizedRole || ''] || '/login']); // 🔥 Fallback login
  return false;
};