import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces para a API
export interface UsuarioAPI {
  id: number;
  nome: string;
  email: string;
}

export interface TalhaoAPI {
  id: number;
  nome: string;
  area?: number;
  status?: string;
  ultimaColeta?: string;
  totalPragas?: number;
  armadilhasAtivas?: number;
  center?: [number, number];
  boundary?: any;
  pragas?: any;
  armadilhas?: ArmadilhaAPI[];
}

export interface ArmadilhaAPI {
  id: number;
  nome: string;
  foto?: string | null;
  dataFoto?: string | null;
  observacoes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  criadoEm?: string;
}

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
}

export interface CriarTalhaoDTO {
  nome: string;
  area?: number;
  status?: string;
  centerLat?: number;
  centerLng?: number;
  boundaryJson?: any;
  pragasJson?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://backbanco-dvedfbbfgeedfmfm.chilecentral-01.azurewebsites.net'; // URL da sua API

  constructor(private http: HttpClient) { }

  // ===== USUÁRIOS =====
  
  criarUsuario(dados: CriarUsuarioDTO): Observable<UsuarioAPI> {
    return this.http.post<UsuarioAPI>(`${this.baseUrl}/usuarios`, dados);
  }

  // ===== TALHÕES =====
  
  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (token) {
      return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
    }
    return {};
  }

  listarTalhoes(): Observable<TalhaoAPI[]> {
    return this.http.get<TalhaoAPI[]>(`${this.baseUrl}/talhoes`, this.getAuthHeaders());
  }

  obterTalhao(id: number): Observable<TalhaoAPI> {
    return this.http.get<TalhaoAPI>(`${this.baseUrl}/talhoes/${id}`, this.getAuthHeaders());
  }

  criarTalhao(dados: CriarTalhaoDTO): Observable<TalhaoAPI> {
    return this.http.post<TalhaoAPI>(`${this.baseUrl}/talhoes`, dados, this.getAuthHeaders());
  }

  // Criar armadilha em um talhão
  criarArmadilha(talhaoId: number, dados: { nome: string; observacao?: string; latitude?: number; longitude?: number }): Observable<ArmadilhaAPI> {
    return this.http.post<ArmadilhaAPI>(`${this.baseUrl}/talhoes/${talhaoId}/armadilhas`, dados, this.getAuthHeaders());
  }

  atualizarTalhao(id: number, dados: Partial<CriarTalhaoDTO>): Observable<TalhaoAPI> {
    return this.http.put<TalhaoAPI>(`${this.baseUrl}/talhoes/${id}`, dados, this.getAuthHeaders());
  }

  deletarTalhao(id: number): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(`${this.baseUrl}/talhoes/${id}`, this.getAuthHeaders());
  }

  // Upload de foto para armadilha (envia data URL base64)
  uploadArmadilhaFoto(talhaoId: number, armadilhaId: number, dataUrl: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/talhoes/${talhaoId}/armadilhas/${armadilhaId}/foto`, { dataUrl }, this.getAuthHeaders());
  }

  // Lista armadilhas disponíveis para registro por rodízio (não usadas no ciclo atual)
  listarArmadilhasDisponiveis(talhaoId: number): Observable<{ disponiveis: ArmadilhaAPI[]; cicloAtual: number }> {
    return this.http.get<{ disponiveis: ArmadilhaAPI[]; cicloAtual: number }>(`${this.baseUrl}/talhoes/${talhaoId}/armadilhas-disponiveis`, this.getAuthHeaders());
  }

  // mobile-pragasCafe/src/app/services/api.service.ts
registrarFotoRodizio(talhaoId: number, dataUrl: string) {
  return this.http.post<any>(`${this.baseUrl}/talhoes/${talhaoId}/registrar-foto`, { dataUrl }, this.getAuthHeaders());
}
}