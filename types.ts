export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Order {
  id: string;
  customerName: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  items: number;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor';
}

export enum BotMessageType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  PROMOTION = 'PROMOTION'
}