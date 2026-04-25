import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { Patient } from '../models/patient.model';
import { Medecin } from '../models/medecin.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  getAllMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.API_URL}${API_CONFIG.endpoints.admin.medecins}`);
  }

  getPublicMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.API_URL}${API_CONFIG.endpoints.public.medecins}`);
  }

  getMedecinsBySpecialite(specialite: string): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(
      `${this.API_URL}${API_CONFIG.endpoints.public.medecinsBySpecialite}/${specialite}`
    );
  }


getMedecinDetails(id: number): Observable<any> {
  return this.http.get(`${this.API_URL}/admin/medecins/${id}/details`);
}

deleteMedecin(id: number): Observable<any> {
  return this.http.delete(`${this.API_URL}/admin/medecins/${id}`);
}

getMedecinById(id: number): Observable<Medecin> {
  return this.http.get<Medecin>(`${this.API_URL}/admin/medecins/${id}`);
}

getAllPatients(): Observable<Patient[]> {
  return this.http.get<Patient[]>(`${this.API_URL}/admin/patients`);
}

getPatientDetails(id: number): Observable<any> {
  return this.http.get(`${this.API_URL}/admin/patients/${id}/details`);
}

deletePatient(id: number): Observable<any> {
  return this.http.delete(`${this.API_URL}/admin/patients/${id}`);
}

}