import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login')
        .then(m => m.LoginComponent),
  },
  
    {
  path: 'admin',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./components/layout/layout')
      .then(m => m.LayoutComponent),
  children: [
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/orders/orders')
            .then(m => m.OrdersComponent),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./components/stats/stats')
            .then(m => m.StatsComponent),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./components/menu-admin/menu-admin')
            .then(m => m.MenuAdminComponent),
      },
     {
  path: 'qr-codes',
  loadComponent: () =>
    import('./components/qr-codes/qr-codes')
      .then(m => m.QrCodesComponent),
},
{
  path: 'plan',
  loadComponent: () =>
    import('./components/cafe-plan/cafe-plan')
      .then(m => m.CafePlanComponent),
},
{
  path: 'kitchen',
  loadComponent: () =>
    import('./components/kitchen/kitchen')
      .then(m => m.KitchenComponent),
},
{
  path: 'reviews',
  loadComponent: () =>
    import('./components/reviews/reviews')
      .then(m => m.ReviewsComponent),
},
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full'
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];