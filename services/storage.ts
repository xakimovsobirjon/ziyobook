import { StoreData, Product, Partner, Transaction, TransactionType, PaymentMethod } from '../types';

const STORAGE_KEY = 'ziyobook_data_v1';

const INITIAL_DATA: StoreData = {
  products: [
    { id: '1', name: 'O\'tkan kunlar', category: 'Badiiy', priceBuy: 25000, priceSell: 45000, stock: 12, minStock: 5 },
    { id: '2', name: 'Atom odatlar', category: 'Psixologiya', priceBuy: 40000, priceSell: 75000, stock: 4, minStock: 5 },
    { id: '3', name: 'Alkimyogar', category: 'Badiiy', priceBuy: 30000, priceSell: 55000, stock: 20, minStock: 5 },
    { id: '4', name: 'Stive Jobs', category: 'Biografiya', priceBuy: 60000, priceSell: 110000, stock: 2, minStock: 3 },
  ],
  partners: [
    { id: 'p1', name: 'Azizbek K.', phone: '+998901234567', type: 'CUSTOMER', balance: 50000 },
    { id: 's1', name: 'Sharq Nashriyoti', phone: '+998712000000', type: 'SUPPLIER', balance: -2000000 },
  ],
  transactions: [
    { 
      id: 't1', 
      date: new Date(Date.now() - 86400000).toISOString(), 
      type: TransactionType.SALE, 
      totalAmount: 110000, 
      profit: 40000,
      paymentMethod: PaymentMethod.CASH,
      items: [] 
    }
  ]
};

export const getStoreData = (): StoreData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const saveStoreData = (data: StoreData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateId = () => Math.random().toString(36).substr(2, 9);