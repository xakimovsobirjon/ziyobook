import { doc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { StoreData, TransactionType, PaymentMethod, CartItem } from '../types';

const COLLECTION_NAME = 'ziyobook';
const DOC_NAME = 'store';
const SESSIONS_DOC = 'sessions';

// Initial data for new stores (exported for auth.ts)
export const INITIAL_STORE_DATA: StoreData = {
  products: [],
  partners: [],
  employees: [],
  transactions: []
};

const LEGACY_INITIAL_DATA: StoreData = {
  products: [
    { id: '1', name: 'O\'tkan kunlar', category: 'Badiiy', priceBuy: 25000, priceSell: 45000, stock: 12, minStock: 5, barcode: '4780000000001', imageUrl: 'https://assets.asaxiy.uz/product/items/desktop/5e15bc9d92383.jpg' },
    { id: '2', name: 'Atom odatlar', category: 'Psixologiya', priceBuy: 40000, priceSell: 75000, stock: 4, minStock: 5, barcode: '9780000000002', imageUrl: 'https://assets.asaxiy.uz/product/items/desktop/698d51a19d8a121ce581499d7b70166820230527125740523041X5t8l2p0kH.jpg' },
    { id: '3', name: 'Alkimyogar', category: 'Badiiy', priceBuy: 30000, priceSell: 55000, stock: 20, minStock: 5, barcode: '4780000000003', imageUrl: 'https://assets.asaxiy.uz/product/items/desktop/5e15c26a61a4f.jpg' },
    { id: '4', name: 'Stive Jobs', category: 'Biografiya', priceBuy: 60000, priceSell: 110000, stock: 2, minStock: 3, barcode: '4780000000004', imageUrl: 'https://assets.asaxiy.uz/product/items/desktop/5e15bf948c262.jpg' },
  ],
  partners: [
    { id: 'p1', name: 'Azizbek K.', phone: '+998901234567', type: 'CUSTOMER', balance: 50000 },
    { id: 's1', name: 'Sharq Nashriyoti', phone: '+998712000000', type: 'SUPPLIER', balance: -2000000 },
  ],
  employees: [
    { id: 'e1', name: 'Sardor Rahim', role: 'Sotuvchi', phone: '+998998887766', salary: 3000000 },
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

// Session data interfaces
export interface POSSessionData {
  cart: CartItem[];
  customerId: string;
  paymentMethod: PaymentMethod;
}

export interface SupplyCartItem extends CartItem {
  newCost: number;
}

export interface SupplySessionData {
  cart: SupplyCartItem[];
  supplierId: string;
  paymentMethod: PaymentMethod;
}

// Get store data from Firebase (multi-tenant support)
export const getStoreData = async (storeId?: string): Promise<StoreData> => {
  // Create a timeout promise (5 seconds)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firebase timeout')), 5000);
  });

  try {
    // Multi-tenant: use storeId if provided
    const docRef = storeId
      ? doc(db, 'stores', storeId, 'data', 'main')
      : doc(db, COLLECTION_NAME, DOC_NAME);

    // Race between Firebase fetch and timeout
    const docSnap = await Promise.race([
      getDoc(docRef),
      timeoutPromise
    ]);

    if (docSnap.exists()) {
      const data = docSnap.data() as StoreData;
      return data;
    } else {
      // Initialize with empty data for new stores
      const initialData = storeId ? INITIAL_STORE_DATA : LEGACY_INITIAL_DATA;
      await setDoc(docRef, initialData);
      return initialData;
    }
  } catch (error) {
    console.error('Error fetching data from Firebase:', error);
    return storeId ? INITIAL_STORE_DATA : LEGACY_INITIAL_DATA;
  }
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

// Save store data to Firebase (multi-tenant support)
export const saveStoreData = async (data: StoreData, storeId?: string): Promise<void> => {
  console.log('💾 Saving data to Firebase...', {
    products: data.products.length,
    partners: data.partners.length,
    employees: data.employees.length,
    transactions: data.transactions.length,
    storeId: storeId || 'legacy'
  });

  try {
    const docRef = storeId
      ? doc(db, 'stores', storeId, 'data', 'main')
      : doc(db, COLLECTION_NAME, DOC_NAME);
    // Clean data to remove undefined values
    const cleanData = removeUndefined(data);
    await setDoc(docRef, cleanData);
    console.log('✅ Data saved to Firebase successfully!');
  } catch (error) {
    console.error('❌ Error saving data to Firebase:', error);
    throw error;
  }
};

// Subscribe to real-time updates (multi-tenant support)
export const subscribeToStoreData = (callback: (data: StoreData) => void, storeId?: string): (() => void) => {
  const docRef = storeId
    ? doc(db, 'stores', storeId, 'data', 'main')
    : doc(db, COLLECTION_NAME, DOC_NAME);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as StoreData);
    }
  }, (error) => {
    console.error('Error in real-time listener:', error);
  });

  return unsubscribe;
};

// ============================================
// POS Session Functions
// ============================================

export const getPOSSessionData = async (): Promise<POSSessionData> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        cart: data.pos_cart || [],
        customerId: data.pos_customer || '',
        paymentMethod: data.pos_payment || PaymentMethod.CASH
      };
    }
  } catch (error) {
    console.error('Error fetching POS session:', error);
  }

  return { cart: [], customerId: '', paymentMethod: PaymentMethod.CASH };
};

export const savePOSSessionData = async (data: POSSessionData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    await setDoc(docRef, {
      ...existingData,
      pos_cart: removeUndefined(data.cart),
      pos_customer: data.customerId,
      pos_payment: data.paymentMethod
    });
    console.log('✅ POS session saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving POS session:', error);
  }
};

export const clearPOSSessionData = async (): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    await setDoc(docRef, {
      ...existingData,
      pos_cart: [],
      pos_customer: '',
      pos_payment: PaymentMethod.CASH
    });
    console.log('✅ POS session cleared');
  } catch (error) {
    console.error('❌ Error clearing POS session:', error);
  }
};

// ============================================
// Supply Session Functions
// ============================================

export const getSupplySessionData = async (): Promise<SupplySessionData> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        cart: data.supply_cart || [],
        supplierId: data.supply_supplier || '',
        paymentMethod: data.supply_payment || PaymentMethod.CASH
      };
    }
  } catch (error) {
    console.error('Error fetching Supply session:', error);
  }

  return { cart: [], supplierId: '', paymentMethod: PaymentMethod.CASH };
};

export const saveSupplySessionData = async (data: SupplySessionData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    await setDoc(docRef, {
      ...existingData,
      supply_cart: removeUndefined(data.cart),
      supply_supplier: data.supplierId,
      supply_payment: data.paymentMethod
    });
    console.log('✅ Supply session saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving Supply session:', error);
  }
};

export const clearSupplySessionData = async (): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SESSIONS_DOC);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    await setDoc(docRef, {
      ...existingData,
      supply_cart: [],
      supply_supplier: '',
      supply_payment: PaymentMethod.CASH
    });
    console.log('✅ Supply session cleared');
  } catch (error) {
    console.error('❌ Error clearing Supply session:', error);
  }
};

// ============================================
// Utility Functions
// ============================================

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions (max 300px for book covers)
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with 70% quality (much smaller than PNG)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        console.log(`📷 Image compressed: ${Math.round(compressedBase64.length / 1024)}KB`);
        resolve(compressedBase64);
      };
      img.onerror = error => reject(error);
      img.src = reader.result as string;
    };
    reader.onerror = error => reject(error);
  });
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `products/${generateId()}.${fileExtension}`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};