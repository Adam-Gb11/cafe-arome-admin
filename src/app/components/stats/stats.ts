import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class StatsComponent implements OnInit {
  private api = inject(ApiService);

  orders  = signal<Order[]>([]);
  loading = signal(true);

  get todayOrders(): Order[] {
    const today = new Date().toDateString();
    return this.orders().filter(o =>
      new Date(o.createdAt).toDateString() === today
    );
  }

  get revenue(): number {
    return this.todayOrders.reduce((s, o) => s + o.total, 0);
  }

  get avgTicket(): number {
    return this.todayOrders.length
      ? this.revenue / this.todayOrders.length
      : 0;
  }

  get topItems(): { name: string; emoji: string; qty: number }[] {
    const map = new Map<string, { name: string; emoji: string; qty: number }>();
    this.orders().forEach(o =>
      o.items.forEach(i => {
        const cur = map.get(i.name) ?? { name: i.name, emoji: i.emoji, qty: 0 };
        map.set(i.name, { ...cur, qty: cur.qty + i.quantity });
      })
    );
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  }

  get maxQty(): number {
    return Math.max(...this.topItems.map(i => i.qty), 1);
  }

  get statusBreakdown() {
    const o = this.orders();
    return [
      { label: 'Nouvelles',    value: o.filter(x => x.status === 'pending').length,   color: '#f0476f' },
      { label: 'Préparation',  value: o.filter(x => x.status === 'preparing').length, color: '#f5a623' },
      { label: 'Prêtes',       value: o.filter(x => x.status === 'ready').length,     color: '#3dd68c' },
      { label: 'Livrées',      value: o.filter(x => x.status === 'delivered').length, color: '#4d9fff' },
    ];
  }

  ngOnInit() {
    this.api.getOrders().subscribe(orders => {
      this.orders.set(orders);
      this.loading.set(false);
    });
  }
}