// models/notification.model.ts

export enum NotificationType {
  NOUVEAU_RDV = 'NOUVEAU_RDV',
  CONFIRMATION_RDV = 'CONFIRMATION_RDV',
  ANNULATION_PAR_PATIENT = 'ANNULATION_PAR_PATIENT',
  ANNULATION_PAR_MEDECIN = 'ANNULATION_PAR_MEDECIN',
  RAPPEL_RDV = 'RAPPEL_RDV',
  DEMANDE_EN_ATTENTE = 'DEMANDE_EN_ATTENTE',
  FACTURE = 'FACTURE',
  PAIEMENT_RECU = 'PAIEMENT_RECU'
}

export enum NotificationStatut {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE',
  ENVOYEE = 'ENVOYEE'
}

export interface NotificationResponse {
  id: number;
  message: string;
  dateEnvoi: string; // ISO 8601
  dateLecture?: string;
  type: NotificationType;
  statut: NotificationStatut;
  donnees?: string; // JSON optionnel
  rendezVousId?: number;
  patientNom?: string;
  medecinNom?: string;
}

export interface NotificationRequest {
  patientId?: number;
  medecinId?: number;
  rendezVousId?: number;
  message: string;
  type: NotificationType;
  donnees?: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}