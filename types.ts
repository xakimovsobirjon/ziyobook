export enum TransactionType {
  SALE = 'SALE',           // Mahsulot sotish
  PURCHASE = 'PURCHASE',   // Mahsulot sotib olish (Kirim)
  EXPENSE = 'EXPENSE',     // Umumiy harajatlar
  SALARY = 'SALARY',       // Ish haqi to'lovi
  DEBT_PAYMENT = 'DEBT_PAYMENT' // Mijozning qarzini to'lashi
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DEBT = 'DEBT', // Nasiya
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category ID or name
  priceBuy: number; // Tannarx
  priceSell: number; // Sotuv narxi
  stock: number;
  minStock: number; // Ogohlantirish chegarasi
  barcode?: string; // Shtrix kod
  imageUrl?: string; // Rasm uchun havola
}

export interface Category {
  id: string;
  name: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  balance: number; // Positive = ular qarz (bizga berishi kerak), Negative = biz qarzmiz
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number; // Oylik maoshi
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
  employeeId?: string; // Agar oylik to'langan bo'lsa
  paymentMethod?: PaymentMethod;
  note?: string;
  profit?: number; // Only calculated for Sales
}

export interface StoreSettings {
  allowNegativeStock: boolean; // Minusga sotish
}

export interface StoreData {
  products: Product[];
  partners: Partner[];
  employees: Employee[];
  transactions: Transaction[];
  categories: Category[];
  settings?: StoreSettings;
}