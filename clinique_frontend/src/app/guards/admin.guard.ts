// guards/admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si connecté
  if (!authService.isLoggedIn()) {
    console.log('🔒 Guard ADMIN: Non connecté');
    router.navigate(['/login']); // 🔥 LOGIN pas welcome
    return false;
  }

  // Récupérer et normaliser le rôle
  const role = authService.getCurrentRole();
  const normalizedRole = role?.replace('ROLE_', '');
  
  console.log('🔍 Guard ADMIN - Rôle:', role, 'Normalisé:', normalizedRole);

  // Vérifier si ADMIN
  if (normalizedRole === 'ADMIN' || role === 'ADMIN') {
    console.log('✅ Guard ADMIN: Accès autorisé');
    return true;
  }

  // Redirection selon le vrai rôle
  console.log('❌ Guard ADMIN: Accès refusé pour le rôle', role);
  
  const routes: { [key: string]: string } = {
    'MEDECIN': '/medecin/dashboard',
    'PATIENT': '/patient/dashboard'
  };
  
  const redirectRoute = routes[normalizedRole || ''] || '/login'; // 🔥 Fallback vers login
  router.navigate([redirectRoute]);
  return false;
};