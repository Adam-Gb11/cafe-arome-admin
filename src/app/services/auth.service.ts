import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api    = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isLoggedIn  = signal(false);

  constructor() {
    const token = localStorage.getItem('cafe_token');
    const user  = localStorage.getItem('cafe_user');
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isLoggedIn.set(true);
    }
  }

  login(email: string, password: string) {
    return this.api.login(email, password);
  }

  saveSession(token: string, user: User) {
    localStorage.setItem('cafe_token', token);
    localStorage.setItem('cafe_user', JSON.stringify(user));
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
  }

  logout() {
    localStorage.removeItem('cafe_token');
    localStorage.removeItem('cafe_user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}