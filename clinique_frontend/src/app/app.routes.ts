import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { medecinGuard } from './guards/medecin.guard';
import { patientGuard } from './guards/patient.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  
  // ========== PUBLIC ==========
  {
    path: 'welcome',
    loadComponent: () => import('./views/shared/landing/landing.component')
      .then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./views/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./views/auth/register-patient/register-patient.component')
      .then(m => m.RegisterPatientComponent)
  },

  // ========== ADMIN ==========
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'medecins',
        loadComponent: () => import('./views/admin/medecin-list/medecin-list.component')
          .then(m => m.MedecinListComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./views/admin/patient-list/patient-list.component')
          .then(m => m.PatientListComponent)
      },
      {
        path: 'create-medecin',
        loadComponent: () => import('./views/admin/create-medecin/create-medecin.component')
          .then(m => m.CreateMedecinComponent)
      },
      {
        path: 'rendezvous',
        loadComponent: () => import('./views/admin/rendezvous-list/rendezvous-list.component')
          .then(m => m.GestionRendezvousComponent)
      }
    ]
  },

  // ========== MEDECIN ==========
  {
    path: 'medecin',
    canActivate: [medecinGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/medecin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'rendezvous',
        loadComponent: () => import('./views/medecin/rendezvous-list/rendezvous-list.component')
          .then(m => m.RendezvousListComponent)
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./views/medecin/calendrier-rdv/calendrier-rdv.component')
          .then(m => m.CalendrierRdvComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./views/medecin/mes-patients/mes-patients.component')
          .then(m => m.MesPatientsComponent)
      },
      {
        path: 'dossiers',
        loadComponent: () => import('./views/medecin/dossiers-medicaux/dossiers-medicaux.component')
          .then(m => m.DossiersMedicauxComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./views/medecin/notification-medecin/notification-medecin.component')
          .then(m => m.NotificationMedecinComponent)
      },
      {
        path: 'consultation/new',
        loadComponent: () => import('./views/medecin/consultation-form/consultation-form.component')
          .then(m => m.ConsultationFormComponent)
      },
      {
        path: 'consultation/:id',
        loadComponent: () => import('./views/medecin/consultation-detail/consultation-detail.component')
          .then(m => m.ConsultationDetailComponent)
      },
      {
        path: 'facture/:id',
        loadComponent: () => import('./views/medecin/facture-view/facture-view.component')
          .then(m => m.FactureViewComponent)
      }
    ]
  },

  // ========== PATIENT ==========
  {
    path: 'patient',
    canActivate: [patientGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/patient/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'rendezvous',
        loadComponent: () => import('./views/patient/mes-rendezvous/mes-rendezvous.component')
          .then(m => m.MesRendezvousComponent)
      },
      {
        path: 'prendre-rdv',
        loadComponent: () => import('./views/patient/prendre-rdv/prendre-rdv.component')
          .then(m => m.PrendreRdvComponent)
      },
      {
        path: 'dossier',
        loadComponent: () => import('./views/patient/mon-dossier/mon-dossier.component')
          .then(m => m.MonDossierComponent)
      },
      {
        path: 'medecins',
        loadComponent: () => import('./views/patient/liste-medecins/liste-medecins.component')
          .then(m => m.ListeMedecinsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./views/patient/notifications/notifications.component')
          .then(m => m.NotificationPatientComponent)
      },
      // ✅ ROUTES CORRIGÉES
      {
        path: 'paiements',
        loadComponent: () => import('./views/patient/patient-paiement/patient-paiement.component')
          .then(m => m.PatientPaiementComponent)
      },
      {
        path: 'facture/:id',
        loadComponent: () => import('./views/patient/facture-view-patient/facture-view-patient.component')
          .then(m => m.FactureViewPatientComponent)
      }
    ]
  },

  // ========== FALLBACK ==========
  { path: '**', redirectTo: 'welcome' }
];