// models/rendezvous.model.ts

// ============================================
// RENDEZ-VOUS
// ============================================

export interface RendezVous {
  id: number;
  date: string;
  heure: string;
  motif: string;
  statut: RendezVousStatus;
  
  // Patient info
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  patientEmail: string;
  patientTel: string;
  
  // Médecin info
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite: string;
}

export interface RendezVousRequest {
  patientId: number;
  medecinId: number;
  date: string;
  heure: string;
  motif: string;
}

// ============================================
// STATUTS
// ============================================

export type RendezVousStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'NON_VENU';

// ============================================
// CALENDRIER
// ============================================

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  status: string;
  color: string;
  patientId: number;
  patientNom: string;
  motif: string;
}

// ============================================
// CONSULTATION (UNIQUE ET COMPLÈTE)
// ============================================

export interface Consultation {
  id: number;
  dateConsultation?: string;
  diagnostic: string;
  ordonnance?: string;
  traitement?: string;
  notes?: string;
  prixConsultation: number;
  montantMedicaments?: number;
  montantTotal?: number;
  statutPaiement?: 'EN_ATTENTE' | 'PAYE' | 'ANNULE';
  
  // Relations
  rendezVousId: number;
  dateRendezVous?: string;
  heureRendezVous?: string;
  
  // Patient
  patientId?: number;
  patientNom?: string;
  patientPrenom?: string;
  
  // Médecin
  medecinId?: number;
  medecinNom?: string;
  medecinPrenom?: string;
  medecinSpecialite?: string;
}

// ============================================
// DOSSIER MÉDICAL
// ============================================

export interface ConsultationResume {
  id: number;
  date: string;
  medecinNom: string;
  specialite: string;
  diagnostic: string;
}

export interface DossierMedicalResponse {
  patientId: number;
  patientNomComplet: string;
  dateNaissance?: string;
  dossierMedical?: string;
  historiqueConsultations: ConsultationResume[];
}


// ============================================
// FACTURATION
// ============================================

export interface FactureResponse {
  consultationId: number;
  numeroFacture: string;
  dateFacture: string;
  
  // Patient
  patientNomComplet: string;
  patientEmail?: string;
  patientTel?: string;
  
  // Médecin
  medecinNomComplet: string;
  medecinSpecialite: string;
  
  // Détails
  motifConsultation?: string;
  dateRendezVous?: string;
  
  // Montants
  prixConsultation: number;
  montantMedicaments: number;
  montantTotal: number;
  statutPaiement: string;
}