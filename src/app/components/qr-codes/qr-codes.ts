import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-codes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-codes.html',
  styleUrl: './qr-codes.css'
})
export class QrCodesComponent {
  tables = signal(Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    url: `http://localhost:4200/menu?table=${i + 1}`,
    qr: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`http://localhost:4200/menu?table=${i + 1}`)}`
  })));

  copied = signal('');

  copy(url: string, table: number) {
    navigator.clipboard.writeText(url);
    this.copied.set(`Table ${table}`);
    setTimeout(() => this.copied.set(''), 2000);
  }
}