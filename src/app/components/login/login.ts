import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = 'admin@cafe-arome.tn';
  password = 'Admin1234!';
  loading  = signal(false);
  error    = signal('');

  login() {
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.auth.saveSession(res.token, res.user);
        this.router.navigate(['/admin/orders']);
      },
      error: () => {
        this.error.set('Email ou mot de passe incorrect');
        this.loading.set(false);
      }
    });
  }
}