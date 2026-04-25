// services/rendezvous.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { 
  RendezVous, 
  RendezVousRequest,
  CalendarEvent,
  Consultation,
  DossierMedicalResponse,
  FactureResponse
} from '../models/rendezvous.model';

@Injectable({
  providedIn: 'root'
})
export class RendezVousService {
  private readonly API_URL = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  // ============================================
  // PATIENT
  // ============================================
  
  createRendezVous(request: RendezVousRequest): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${this.API_URL}/rendezvous`, request);
  }

  modifierRendezVous(rendezVousId: number, request: RendezVousRequest, patientId: number): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.API_URL}/rendezvous/${rendezVousId}`, request, {
      params: { patientId: patientId.toString() }
    });
  }

  getRendezVousByPatient(patientId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/patient/${patientId}`);
  }

  cancelRendezVous(rendezVousId: number, patientId: number): Observable<any> {
    return this.http.put(`${this.API_URL}/rendezvous/${rendezVousId}/cancel`, null, {
      params: { patientId: patientId.toString() }
    });
  }

  // ============================================
  // MÉDECIN
  // ============================================
  
  getRendezVousByMedecin(medecinId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/medecin/${medecinId}`);
  }

  getRendezVousDuJour(medecinId: number, date: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/medecin/${medecinId}/today`, {
      params: { date }
    });
  }

updateStatus(rendezVousId: number, statut: string, medecinId: number): Observable<RendezVous> {
  const url = `${this.API_URL}/rendezvous/${rendezVousId}/status`;
  
  console.log('🔍 updateStatus appelé:', { 
    url, 
    rendezVousId, 
    statut, 
    medecinId,
    body: { statut }
  });

  return this.http.put<RendezVous>(
    url,
    { statut },  // Body avec "statut"
    { 
      params: { medecinId: medecinId.toString() }  // Query param
    }
  );
}



  // rendezvous.service.ts - AJOUTEZ CETTE MÉTHODE

getCalendarEvents(medecinId: number, startDate: string, endDate: string): Observable<CalendarEvent[]> {
  return this.http.get<CalendarEvent[]>(`${this.API_URL}/rendezvous/medecin/${medecinId}/calendar`, {
    params: {
      start: startDate,
      end: endDate
    }
  });
}

  // ============================================
  // CRÉNEAUX
  // ============================================
  
  getCreneauxDisponibles(medecinId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/rendezvous/creneaux/${medecinId}`, {
      params: { date }
    });
  }

  getCreneauxOccupes(medecinId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/rendezvous/creneaux/${medecinId}/occupes`, {
      params: { date }
    });
  }

  // ============================================
  // ADMIN
  // ============================================
  
  getAllRendezVous(): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous`);
  }

  filterByPatient(patientId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/filter/patient/${patientId}`);
  }

  filterBySpecialite(specialite: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/filter/specialite/${specialite}`);
  }

  filterByMedecinAndDate(medecinId: number, date: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/filter/medecin/${medecinId}/date`, {
      params: { date }
    });
  }

  // ============================================
  // CONSULTATIONS
  // ============================================
  
  createConsultation(rendezVousId: number, consultation: Partial<Consultation>): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.API_URL}/consultations`, {
      rendezVousId,
      ...consultation
    });
  }

  getConsultationById(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.API_URL}/consultations/${id}`);
  }

  getConsultationByRendezVous(rendezVousId: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.API_URL}/consultations/rendezvous/${rendezVousId}`);
  }

  getConsultationsByMedecin(medecinId: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.API_URL}/consultations/medecin/${medecinId}`);
  }

  getConsultationsByPatient(patientId: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.API_URL}/consultations/patient/${patientId}`);
  }

  terminerConsultationComplet(rdvId: number, medecinId: number, consultationData: any): Observable<any> {
  return this.http.post(`${this.API_URL}/consultations/terminer`, {
    rendezVousId: rdvId,
    medecinId: medecinId,
    ...consultationData
  });
}

getOrCreateConsultation(rdvId: number): Observable<Consultation> {
  return this.http.get<Consultation>(`${this.API_URL}/consultations/rendezvous/${rdvId}/or-create`);
}

  // ============================================
  // FACTURATION
  // ============================================
  
  genererFacture(consultationId: number): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.API_URL}/consultations/${consultationId}/facture`);
  }

  genererFacturePDF(consultationId: number): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.API_URL}/consultations/${consultationId}/facture/pdf`);
  }

  getFacturesByPatient(patientId: number): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(`${this.API_URL}/consultations/patient/${patientId}/factures`);
  }

  updateStatutPaiement(consultationId: number, statut: string): Observable<FactureResponse> {
    return this.http.put<FactureResponse>(`${this.API_URL}/consultations/${consultationId}/paiement`, null, {
      params: { statut }
    });
  }

  getStatistiquesFacturation(medecinId: number, debut: string, fin: string): Observable<any> {
    return this.http.get(`${this.API_URL}/consultations/medecin/${medecinId}/statistiques`, {
      params: { debut, fin }
    });
  }

  // ============================================
  // DOSSIER MÉDICAL
  // ============================================
  
  consulterDossierMedical(patientId: number, medecinId: number): Observable<DossierMedicalResponse> {
    return this.http.get<DossierMedicalResponse>(`${this.API_URL}/dossiers-medicaux/patient/${patientId}`, {
      params: { medecinId: medecinId.toString() }
    });
  }

  getRendezVousEntreDates(medecinId: number, startDate: string, endDate: string): Observable<RendezVous[]> {
  return this.http.get<RendezVous[]>(`${this.API_URL}/rendezvous/medecin/${medecinId}/period`, {
    params: { 
      start: startDate,
      end: endDate 
    }
  });
  
}
updateDossierMedical(patientId: number, medecinId: number, dossierMedical: string): Observable<DossierMedicalResponse> {
  return this.http.put<DossierMedicalResponse>(
    `${this.API_URL}/dossiers-medicaux/patient/${patientId}`,
    dossierMedical,
    { params: { medecinId: medecinId.toString() } }
  );
}

// Pour le patient qui consulte son propre dossier
consulterMonDossierMedical(patientId: number): Observable<DossierMedicalResponse> {
  return this.http.get<DossierMedicalResponse>(`${this.API_URL}/dossiers-medicaux/patient/mon-dossier/${patientId}`);
}
}