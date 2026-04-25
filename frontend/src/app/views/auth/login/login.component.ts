import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  // Mapping des rôles vers les routes
  private readonly ROLE_ROUTES: { [key: string]: string } = {
    'ADMIN': '/admin/dashboard',
    'MEDECIN': '/medecin/dashboard',
    'PATIENT': '/patient/dashboard',
    // Fallbacks si le rôle a différents formats
    'ROLE_ADMIN': '/admin/dashboard',
    'ROLE_MEDECIN': '/medecin/dashboard',
    'ROLE_PATIENT': '/patient/dashboard'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Si déjà connecté, rediriger selon le rôle
    if (this.authService.isLoggedIn()) {
      const currentRole = this.authService.getCurrentRole();
      console.log('🔄 Déjà connecté, rôle:', currentRole);
      if (currentRole) {
        this.navigateByRole(currentRole);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (result) => {
        this.isLoading = false;
        console.log('✅ Résultat login:', result);

        if (result.success && result.role) {
          // Navigation avec le rôle retourné
          this.navigateByRole(result.role);
        } else {
          this.errorMessage = result.message || 'Erreur de connexion';
          console.error('❌ Échec login:', result);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Erreur HTTP:', err);
        this.errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:8081';
      }
    });
  }

  /**
   * NAVIGATION par rôle - Méthode clé
   */
  private navigateByRole(role: string): void {
    console.log('🧭 Navigation demandée pour le rôle:', role);

    // Normaliser le rôle (supprimer ROLE_ si présent)
    const normalizedRole = role.replace('ROLE_', '');
    console.log('🧭 Rôle normalisé:', normalizedRole);

    // Chercher la route
    let targetRoute = this.ROLE_ROUTES[normalizedRole];
    
    // Si pas trouvé, essayer avec le rôle original
    if (!targetRoute) {
      targetRoute = this.ROLE_ROUTES[role];
    }

    // Fallback final
    if (!targetRoute) {
      console.warn('⚠️ Rôle non reconnu:', role, '- Redirection par défaut vers PATIENT');
      targetRoute = '/patient/dashboard';
    }

    console.log('🚀 Navigation vers:', targetRoute);

    // Navigation avec animation de chargement
    this.router.navigate([targetRoute], { 
      replaceUrl: true,
      skipLocationChange: false 
    }).then(success => {
      if (success) {
        console.log('✅ Navigation réussie!');
      } else {
        console.error('❌ Navigation échouée');
        this.errorMessage = 'Erreur de navigation. Veuillez réessayer.';
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}