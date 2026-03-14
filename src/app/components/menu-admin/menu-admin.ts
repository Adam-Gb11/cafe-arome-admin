import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MenuItem } from '../../models/models';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-admin.html',
  styleUrl: './menu-admin.css'
})
export class MenuAdminComponent implements OnInit {
  private api = inject(ApiService);

  items         = signal<MenuItem[]>([]);
  loading       = signal(true);
  editingItem   = signal<MenuItem | null>(null);
  saving        = signal(false);
  notification  = signal('');

  // formulaire d'édition
  editName        = '';
  editDescription = '';
  editPrice       = 0;
  editAvailable   = true;

  readonly categories: Record<string, string> = {
    cafe:       '☕ Cafés',
    boisson:    '🥤 Boissons',
    patisserie: '🥐 Pâtisseries',
    plat:       '🍽️ Plats',
    dessert:    '🍰 Desserts',
  };

  readonly badgeLabels: Record<string, string> = {
    popular: 'Populaire',
    new:     'Nouveau',
    chef:    'Signature',
  };

  get groupedItems() {
    const items = this.items();
    const cats  = Object.keys(this.categories);
    return cats.map(c => ({
      category: c,
      label:    this.categories[c],
      items:    items.filter(i => i.category === c),
    })).filter(g => g.items.length > 0);
  }

  ngOnInit() {
    this.api.getAllMenuItems().subscribe(items => {
      this.items.set(items);
      this.loading.set(false);
    });
  }

  openEdit(item: MenuItem) {
    this.editingItem.set(item);
    this.editName        = item.name;
    this.editDescription = item.description;
    this.editPrice       = item.price;
    this.editAvailable   = item.available;
  }

  closeEdit() {
    this.editingItem.set(null);
  }

  saveEdit() {
    const item = this.editingItem();
    if (!item) return;
    this.saving.set(true);

    const data = {
      name:        this.editName,
      description: this.editDescription,
      price:       this.editPrice,
      available:   this.editAvailable,
    };

    this.api.updateMenuItem(item._id, data).subscribe({
      next: updated => {
        this.items.update(list =>
          list.map(i => i._id === updated._id ? updated : i)
        );
        this.saving.set(false);
        this.closeEdit();
        this.showNotif(`✅ ${updated.name} mis à jour`);
      },
      error: () => {
        this.saving.set(false);
        this.showNotif('❌ Erreur lors de la sauvegarde');
      }
    });
  }

  toggleAvailable(item: MenuItem) {
    this.api.updateMenuItem(item._id, { available: !item.available }).subscribe(updated => {
      this.items.update(list =>
        list.map(i => i._id === updated._id ? updated : i)
      );
      const state = updated.available ? 'activé' : 'désactivé';
      this.showNotif(`${updated.emoji} ${updated.name} ${state}`);
    });
  }

  private showNotif(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 3000);
  }
}