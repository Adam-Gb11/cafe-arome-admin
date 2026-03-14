// Article du menu
export interface MenuItem {
  _id:         string;
  name:        string;
  description: string;
  price:       number;
  category:    string;
  emoji:       string;
  badge:       string | null;
  available:   boolean;
}

// Ligne de commande
export interface OrderItem {
  menuItem: string;
  name:     string;
  emoji:    string;
  price:    number;
  quantity: number;
  subtotal: number;
}

// Commande complète
export interface Order {
  _id:         string;
  orderNumber: string;
  tableNumber: number;
  items:       OrderItem[];
  total:       number;
  note:        string;
  status:      'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt:   string;
}

// Utilisateur admin
export interface User {
  _id:   string;
  name:  string;
  email: string;
  role:  string;
}

// Réponse login
export interface AuthResponse {
  token: string;
  user:  User;
}