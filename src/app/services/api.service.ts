import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private http = inject(HttpClient);
  private apiUrl = 'https://afe-arome-backend-production.up.railway.app/api';

  private headers() {
    const token = localStorage.getItem('cafe_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Menu ──────────────────────────────────────────────
getAllMenuItems(): Observable<MenuItem[]> {
  return this.http.get<MenuItem[]>(`${this.apiUrl}/menu?all=true`, {
    headers: this.headers()
  });
}

updateMenuItem(id: string, data: Partial<MenuItem>): Observable<MenuItem> {
  return this.http.patch<MenuItem>(`${this.apiUrl}/menu/${id}`, data, {
    headers: this.headers()
  });
}

createMenuItem(data: Partial<MenuItem>): Observable<MenuItem> {
  return this.http.post<MenuItem>(`${this.apiUrl}/menu`, data, {
    headers: this.headers()
  });
}

deleteMenuItem(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/menu/${id}`, {
    headers: this.headers()
  });
}
  // ── Orders ────────────────────────────────────────────
  getOrders(status?: string, date?: string): Observable<Order[]> {
  let params = '';
  if (status) params += `status=${status}`;
  if (date) params += `${params ? '&' : ''}date=${date}`;
  const url = params ? `${this.apiUrl}/orders?${params}` : `${this.apiUrl}/orders`;
  return this.http.get<Order[]>(url, { headers: this.headers() });
}
  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/orders/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }

  // ── Auth ──────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }
  // ── Reviews ──
getReviews(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/reviews`, {
    headers: this.headers()
  });
}

getReviewStats(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/reviews/stats`, {
    headers: this.headers()
  });
}
// ── Calls ──
getCalls(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/calls`, {
    headers: this.headers()
  });
}

answerCall(id: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/calls/${id}`, {}, {
    headers: this.headers()
  });
}
}