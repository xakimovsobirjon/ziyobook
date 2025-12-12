export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE', // Buying from supplier
  EXPENSE = 'EXPENSE',   // Rent, bills, etc.
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DEBT = 'DEBT', // Nasiya
}

export interface Product {
  id: string;
  name: string;
  category: string;
  priceBuy: number; // Tannarx
  priceSell: number; // Sotuv narxi
  stock: number;
  minStock: number; // Ogohlantirish chegarasi
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  balance: number; // Positive = they owe us (debt), Negative = we owe them (prepayment/debt)
}

export interface CartItem extends Product {
  qty: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  totalAmount: number;
  items?: CartItem[];
  partnerId?: string; // Customer or Supplier ID
  paymentMethod?: PaymentMethod;
  note?: string;
  profit?: number; // Only calculated for Sales
}

export interface StoreData {
  products: Product[];
  partners: Partner[];
  transactions: Transaction[];
}