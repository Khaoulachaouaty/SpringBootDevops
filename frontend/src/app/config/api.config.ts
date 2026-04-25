// config/api.config.ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:8082/clinique/api',
  endpoints: {
    auth: {
      login: '/auth/login',
      registerPatient: '/auth/register/patient',
      createMedecin: '/admin/medecins'
    },
    admin: {
      patients: '/admin/patients',
      medecins: '/admin/medecins'
    },
    public: {
      medecins: '/public/medecins',
      medecinsBySpecialite: '/public/medecins/specialite'
    },
    rendezvous: {
      base: '/rendezvous',
      creneaux: '/rendezvous/creneaux'
    },
    consultations: {
      base: '/consultations',
      byMedecin: (id: number) => `/consultations/medecin/${id}`,
      byPatient: (id: number) => `/consultations/patient/${id}`,
      facture: (id: number) => `/consultations/${id}/facture`,
      facturePDF: (id: number) => `/consultations/${id}/facture/pdf`,
      paiement: (id: number) => `/consultations/${id}/paiement`,
      statistiques: (id: number) => `/consultations/medecin/${id}/statistiques`
    },
    dossiersMedicaux: {
      consulter: (patientId: number) => `/dossiers-medicaux/patient/${patientId}`
    },
    notifications: {
      base: '/notifications',
      patient: (id: number) => `/notifications/patient/${id}`,
      patientUnread: (id: number) => `/notifications/patient/${id}/non-lues`,
      patientCount: (id: number) => `/notifications/patient/${id}/count-non-lues`,
      patientMarkAll: (id: number) => `/notifications/patient/${id}/tout-lire`,
      medecin: (id: number) => `/notifications/medecin/${id}`,
      medecinUnread: (id: number) => `/notifications/medecin/${id}/non-lues`,
      medecinCount: (id: number) => `/notifications/medecin/${id}/count-non-lues`,
      medecinMarkAll: (id: number) => `/notifications/medecin/${id}/tout-lire`,
      markRead: (id: number) => `/notifications/${id}/lue`,
      simulerRappels: '/notifications/simuler/rappels'
    }
  }
} as const;