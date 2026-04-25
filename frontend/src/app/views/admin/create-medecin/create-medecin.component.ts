import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors 
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CreateMedecinRequest } from '../../../models/user.model';

@Component({
  selector: 'app-create-medecin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-medecin.component.html',
  styleUrls: ['./create-medecin.component.css']
})
export class CreateMedecinComponent {
  medecinForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  specialites = [
    'Cardiologie', 'Dermatologie', 'Endocrinologie', 
    'Gastroentérologie', 'Gynécologie', 'Neurologie',
    'Ophtalmologie', 'Orthopédie', 'Pédiatrie',
    'Psychiatrie', 'Radiologie', 'Rhumatologie',
    'Urologie', 'Médecine générale'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.medecinForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      tel: ['', [Validators.pattern(/^[0-9]{8}$/)]],
      specialite: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.medecinForm.invalid) {
      this.markAllAsTouched();
      this.errorMessage = 'Veuillez corriger les erreurs du formulaire.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { confirmPassword, ...data } = this.medecinForm.value;

    this.authService.createMedecin(data as CreateMedecinRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.successMessage = `Dr. ${data.prenom} ${data.nom} créé avec succès ! Redirection...`;
          this.medecinForm.reset();
          
          // ✅ REDIRECTION VERS L'INTERFACE MEDECIN
          setTimeout(() => {
            this.router.navigate(['/medecin/dashboard']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la création du médecin.';
        console.error(err);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.medecinForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}