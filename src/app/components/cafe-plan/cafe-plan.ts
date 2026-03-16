import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';

interface TableState {
  number:  number;
  status:  'free' | 'pending' | 'preparing' | 'calling';
  orders:  Order[];
}

@Component({
  selector: 'app-cafe-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cafe-plan.html',
  styleUrl: './cafe-plan.css'
})
export class CafePlanComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private sub!: Subscription;

  tables      = signal<TableState[]>([]);
  calls       = signal<any[]>([]);
  selected    = signal<TableState | null>(null);
  loading     = signal(true);

  readonly totalTables = 20;

  ngOnInit() {
    this.sub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.api.getOrders()),
    ).subscribe(orders => {
      this.buildTables(orders);
      this.loading.set(false);
    });

    interval(4000).pipe(
      startWith(0),
      switchMap(() => this.api.getCalls()),
    ).subscribe(calls => {
      this.calls.set(calls);
      this.buildTablesWithCalls();
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private lastOrders: Order[] = [];

  private buildTables(orders: Order[]) {
    this.lastOrders = orders;
    this.buildTablesWithCalls();
  }

  private buildTablesWithCalls() {
    const orders = this.lastOrders;
    const calls  = this.calls();
    const today  = new Date().toDateString();

    const todayOrders = orders.filter(o =>
      new Date(o.createdAt).toDateString() === today &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled'
    );

    const tables: TableState[] = Array.from({ length: this.totalTables }, (_, i) => {
      const num         = i + 1;
      const tableOrders = todayOrders.filter(o => o.tableNumber === num);
      const isCalling   = calls.some(c => c.tableNumber === num);

      let status: TableState['status'] = 'free';
      if (isCalling)                                              status = 'calling';
      else if (tableOrders.some(o => o.status === 'pending'))    status = 'pending';
      else if (tableOrders.some(o => o.status === 'preparing'))  status = 'preparing';

      return { number: num, status, orders: tableOrders };
    });

    this.tables.set(tables);

    // Mettre à jour la table sélectionnée
    const sel = this.selected();
    if (sel) {
      const updated = tables.find(t => t.number === sel.number);
      if (updated) this.selected.set(updated);
    }
  }

  selectTable(t: TableState) {
    if (this.selected()?.number === t.number) {
      this.selected.set(null);
    } else {
      this.selected.set(t);
    }
  }

  closeDetail() { this.selected.set(null); }

  get statusLabel(): Record<string, string> {
    return {
      free:      'Libre',
      pending:   'Nouvelle commande',
      preparing: 'En préparation',
      calling:   'Appel serveur',
    };
  }

  get statusIcon(): Record<string, string> {
    return {
      free:      '○',
      pending:   '🔴',
      preparing: '🟡',
      calling:   '🔔',
    };
  }

  get stats() {
    const t = this.tables();
    return {
      free:      t.filter(x => x.status === 'free').length,
      pending:   t.filter(x => x.status === 'pending').length,
      preparing: t.filter(x => x.status === 'preparing').length,
      calling:   t.filter(x => x.status === 'calling').length,
    };
  }
}