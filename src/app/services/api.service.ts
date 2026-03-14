import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';

  private headers() {
    const token = localStorage.getItem('cafe_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Menu ──────────────────────────────────────────────
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.base}/menu`, {
      headers: this.headers()
    });
  }

  updateMenuItem(id: string, data: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${this.base}/menu/${id}`, data, {
      headers: this.headers()
    });
  }

  // ── Orders ────────────────────────────────────────────
  getOrders(status?: string): Observable<Order[]> {
    const url = status
      ? `${this.base}/orders?status=${status}`
      : `${this.base}/orders`;
    return this.http.get<Order[]>(url, { headers: this.headers() });
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.base}/orders/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }

  // ── Auth ──────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { email, password });
  }
}