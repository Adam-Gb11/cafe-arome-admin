import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css'
})
export class KitchenComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private sub!: Subscription;

  orders       = signal<Order[]>([]);
  loading      = signal(true);
  notification = signal('');
  private prevCount = 0;

  readonly statusMeta: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Nouveau',       color: 'red' },
    preparing: { label: 'En préparation', color: 'amber' },
  };

  ngOnInit() {
    this.sub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.api.getOrders()),
    ).subscribe(orders => {
      const kitchenOrders = orders.filter(o =>
        o.status === 'pending' || o.status === 'preparing'
      );

      if (kitchenOrders.length > this.prevCount && this.prevCount >= 0) {
        if (kitchenOrders.length > 0 && this.prevCount > 0) {
          this.playSound();
          this.showNotif('🔴 Nouvelle commande !');
        }
      }

      this.prevCount = kitchenOrders.length;
      this.orders.set(kitchenOrders);
      this.loading.set(false);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order._id, status).subscribe(updated => {
      this.orders.update(list =>
        list.map(o => o._id === updated._id ? updated : o)
          .filter(o => o.status === 'pending' || o.status === 'preparing')
      );
      this.showNotif(`Table ${order.tableNumber} — ${status === 'preparing' ? 'En préparation' : 'Prêt !'}`);
    });
  }

  private showNotif(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 3000);
  }

  private playSound() {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }
}