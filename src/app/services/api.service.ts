import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private http = inject(HttpClient);
  private apiUrl = 'https://cafe-arome-backend.onrender.com/api';

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
  getOrders(status?: string): Observable<Order[]> {
    const url = status
      ? `${this.apiUrl}/orders?status=${status}`
      : `${this.apiUrl}/orders`;
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
}