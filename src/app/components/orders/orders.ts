import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class OrdersComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private sub!: Subscription;

  orders       = signal<Order[]>([]);
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  filter       = signal('all');
  loading      = signal(true);
  notification = signal('');

  readonly statusMeta: Record<string, { label: string; icon: string }> = {
    pending:   { label: 'Nouveau',          icon: '🔴' },
    preparing: { label: 'Préparation',      icon: '🟡' },
    ready:     { label: 'Prêt',             icon: '🟢' },
    delivered: { label: 'Livré',            icon: '✅' },
    cancelled: { label: 'Annulé',           icon: '❌' },
    billed:    { label: 'Addition reçue',   icon: '🧾' },
  };

  readonly filters = [
    { id: 'all',       label: 'Toutes' },
    { id: 'pending',   label: 'Nouvelles' },
    { id: 'preparing', label: 'Préparation' },
    { id: 'ready',     label: 'Prêtes' },
    { id: 'delivered', label: 'Livrées' },
  ];

 get filteredOrders(): Order[] {
  const f    = this.filter();
  const date = this.selectedDate();
  let orders = this.orders();

  // Filtre par date
  if (date) {
    orders = orders.filter(o =>
      new Date(o.createdAt).toISOString().split('T')[0] === date
    );
  }

  // Filtre par statut
  if (f !== 'all') {
    orders = orders.filter(o => o.status === f);
  }

  return orders;
}

  get stats() {
    const o = this.orders();
    return {
      total:   o.length,
      pending: o.filter(x => x.status === 'pending').length,
      revenue: o.reduce((s, x) => s + x.total, 0),
      done:    o.filter(x => x.status === 'delivered').length,
    };
  }
  calls= signal<any[]>([]);
  private prevCalls = 0;
  tableStates  = signal<any[]>([]);
private lastOrders: Order[] = [];
  private prevCount = 0;

 ngOnInit() {
  // Reset automatique à minuit
  const checkMidnight = setInterval(() => {
    const today = new Date().toISOString().split('T')[0];
    if (this.selectedDate() !== today) {
      this.selectedDate.set(today);
      this.showNotif('Nouveau jour — commandes remises à zéro !');
    }
  }, 60000); // vérifie chaque minute

  this.sub = interval(5000).pipe(
    startWith(0),
    switchMap(() => this.api.getOrders(undefined, this.selectedDate())),
  ).subscribe(orders => {
    if (orders.length > this.prevCount && this.prevCount > 0) {
      this.showNotif('Nouvelle commande !');
      this.playSound();
    }
    this.prevCount = orders.length;
    this.orders.set(orders);
    this.lastOrders = orders;
this.buildTableStates();
    this.loading.set(false);
  });
  // Polling appels serveur
  interval(4000).pipe(
    startWith(0),
    switchMap(() => this.api.getCalls()),
  ).subscribe(calls => {
    if (calls.length > this.prevCalls && this.prevCalls >= 0) {
      if (calls.length > 0) {
        this.playCallSound();
      }
    }
    this.prevCalls = calls.length;
    this.calls.set(calls);
    this.buildTableStates();
  });
}

  ngOnDestroy() { this.sub?.unsubscribe(); }

  setFilter(f: string) { this.filter.set(f); }

  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order._id, status).subscribe(updated => {
      this.orders.update(list =>
        list.map(o => o._id === updated._id ? updated : o)
      );
      this.showNotif(`${order.orderNumber} -> ${this.statusMeta[status].label}`);
    });
  }

  nextStatus(order: Order): string | null {
    const map: Record<string, string> = {
      pending:   'preparing',
      preparing: 'delivered',
    };
    return map[order.status] ?? null;
  }

  nextLabel(order: Order): string {
    const map: Record<string, string> = {
      pending:   'Preparer',
      preparing: 'Livrer',
    };
    return map[order.status] ?? '';
  }

  exportPDF() {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(20);
    doc.setTextColor(200, 169, 110);
    doc.text('CAFE AROME', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Rapport des commandes - ${date}`, 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Total: ${this.stats.total} commandes`, 14, 40);
    doc.text(`En attente: ${this.stats.pending}`, 14, 47);
    doc.text(`Livrees: ${this.stats.done}`, 14, 54);
    doc.text(`Revenu: ${this.stats.revenue.toFixed(2)} TND`, 14, 61);

    const rows = this.filteredOrders.map(o => [
      o.orderNumber,
      `Table ${o.tableNumber}`,
      o.items.map(i => `${i.name} x${i.quantity}`).join(', '),
      `${o.total.toFixed(2)} TND`,
      this.statusMeta[o.status]?.label ?? o.status,
      new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['N', 'Table', 'Articles', 'Total', 'Statut', 'Heure']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [200, 169, 110], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 2: { cellWidth: 70 } },
    });

    doc.save(`commandes-${date}.pdf`);
    this.showNotif('PDF exporte !');
  }
  answerCall(call: any) {
  this.api.answerCall(call._id).subscribe(() => {
    this.calls.update(list => list.filter(c => c._id !== call._id));
  });
}

private playCallSound() {
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
private buildTableStates() {
  const orders = this.lastOrders;
  const calls  = this.calls();
  const today  = new Date().toDateString();

  const todayOrders = orders.filter(o =>
    new Date(o.createdAt).toDateString() === today &&
    o.status !== 'delivered' &&
    o.status !== 'cancelled'
  );

  const states = Array.from({ length: 20 }, (_, i) => {
    const num         = i + 1;
    const tableOrders = todayOrders.filter(o => o.tableNumber === num);
    const isCalling   = calls.some(c => c.tableNumber === num);

    let status = 'free';
    if (isCalling)                                              status = 'calling';
    else if (tableOrders.some(o => o.status === 'pending'))    status = 'pending';
    else if (tableOrders.some(o => o.status === 'preparing'))  status = 'preparing';

    return { number: num, status };
  });

  this.tableStates.set(states);
}

scrollToTable(tableNumber: number) {
  const el = document.getElementById(`table-${tableNumber}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
printBill(order: Order) {
  // Marquer comme billed
  this.api.updateOrderStatus(order._id, 'billed').subscribe(updated => {
    this.orders.update(list =>
      list.map(o => o._id === updated._id ? updated : o)
    );
    this.showNotif(`🧾 Addition Table ${order.tableNumber} imprimée !`);
  });

  // Générer le PDF
  const doc  = new jsPDF();
  const date = new Date().toLocaleString('fr-FR');

  doc.setFontSize(20);
  doc.setTextColor(200, 169, 110);
  doc.text('CAFE AROME', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Table ${order.tableNumber} — Addition`, 105, 30, { align: 'center' });
  doc.text(date, 105, 37, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 169, 110);
  doc.line(14, 42, 196, 42);

  let y = 52;

  order.items.forEach(item => {
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`${item.name} x${item.quantity}`, 14, y);
    doc.text(`${item.subtotal.toFixed(2)} TND`, 196, y, { align: 'right' });
    y += 8;
  });

  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(200, 169, 110);
  doc.text('TOTAL', 14, y);
  doc.text(`${order.total.toFixed(2)} TND`, 196, y, { align: 'right' });

  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Merci de votre visite !', 105, y, { align: 'center' });

  doc.save(`addition-table-${order.tableNumber}.pdf`);
}
  private showNotif(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 3500);
  }

  private playSound() {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }
}