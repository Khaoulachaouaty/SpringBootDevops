export interface User {
  userId?: number;
  email: string;
  nom?: string;
  prenom?: string;
  tel?: string;
  roles?: string[];
  enabled?: boolean;
  patientId?: number;  // 🔥 AJOUTÉ
  medecinId?: number; 
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterPatientRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  tel?: string;
  dateNaissance: string;
  dossierMedical?: string;
}

export interface CreateMedecinRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  tel?: string;
  specialite: string;

}

// 🔥 AUTH RESPONSE COMPLET
export interface AuthResponse {
  message: string;
  success: boolean;
  userId?: number;
  email?: string;
  nomComplet?: string;
  roles?: string[];
  patientId?: number; 
  medecinId?: number;  

}

// Garder pour compatibilité si besoin
export interface MessageResponse {
  message: string;
  success: boolean;
}