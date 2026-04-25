export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  tel?: string;
  dateNaissance?: string;
  dossierMedical?: string;
}