import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order } from '../../models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class StatsComponent implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(ApiService);

  @ViewChild('hourlyChart') hourlyChartRef!: ElementRef;
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef;

  orders = signal<Order[]>([]);
  loading = signal(true);

  private hourlyChartInstance: Chart | null = null;
  private weeklyChartInstance: Chart | null = null;

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
    return this.todayOrders.length ? this.revenue / this.todayOrders.length : 0;
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
      { label: 'Nouvelles',   value: o.filter(x => x.status === 'pending').length,   color: '#f0476f' },
      { label: 'Préparation', value: o.filter(x => x.status === 'preparing').length, color: '#f5a623' },
      { label: 'Prêtes',      value: o.filter(x => x.status === 'ready').length,     color: '#3dd68c' },
      { label: 'Livrées',     value: o.filter(x => x.status === 'delivered').length, color: '#4d9fff' },
    ];
  }

  // Commandes par heure aujourd'hui
  get hourlyData(): number[] {
    const hours = Array(24).fill(0);
    this.todayOrders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      hours[h]++;
    });
    return hours;
  }

  // Revenus par jour (7 derniers jours)
  get weeklyData(): { labels: string[]; values: number[] } {
    const days: { label: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        date: d.toDateString()
      });
    }
    return {
      labels: days.map(d => d.label),
      values: days.map(d =>
        this.orders()
          .filter(o => new Date(o.createdAt).toDateString() === d.date)
          .reduce((s, o) => s + o.total, 0)
      )
    };
  }

  ngOnInit() {
    this.api.getOrders().subscribe(orders => {
      this.orders.set(orders);
      this.loading.set(false);
      setTimeout(() => this.buildCharts(), 100);
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.hourlyChartInstance?.destroy();
    this.weeklyChartInstance?.destroy();
  }

  private buildCharts() {
    this.buildHourlyChart();
    this.buildWeeklyChart();
  }

  private buildHourlyChart() {
    if (!this.hourlyChartRef) return;
    this.hourlyChartInstance?.destroy();
    this.hourlyChartInstance = new Chart(this.hourlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
        datasets: [{
          label: 'Commandes',
          data: this.hourlyData,
          backgroundColor: 'rgba(200,169,110,0.3)',
          borderColor: '#c8a96e',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#4e5a7a', font: { size: 10 } }, grid: { color: '#20263a' } },
          y: { ticks: { color: '#4e5a7a' }, grid: { color: '#20263a' }, beginAtZero: true }
        }
      }
    });
  }

  private buildWeeklyChart() {
    if (!this.weeklyChartRef) return;
    this.weeklyChartInstance?.destroy();
    const { labels, values } = this.weeklyData;
    this.weeklyChartInstance = new Chart(this.weeklyChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenu (TND)',
          data: values,
          borderColor: '#c8a96e',
          backgroundColor: 'rgba(200,169,110,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#c8a96e',
          pointRadius: 4,
          fill: true,
          tension: 0.4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#4e5a7a', font: { size: 10 } }, grid: { color: '#20263a' } },
          y: { ticks: { color: '#4e5a7a' }, grid: { color: '#20263a' }, beginAtZero: true }
        }
      }
    });
  }
}