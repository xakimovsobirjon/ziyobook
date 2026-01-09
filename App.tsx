import React, { useState, useEffect } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Supply from './components/Supply';
import CRM from './components/CRM';
import AIAnalyst from './components/AIAnalyst';
import Reports from './components/Reports';
import Employees from './components/Employees';
import Expenses from './components/Expenses';
import History from './components/History';
import Login from './components/Login';
import SuperAdmin from './components/SuperAdmin';
import Settings from './components/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getStoreData, saveStoreData, subscribeToStoreData } from './services/storage';
import { updateAdminStoreName } from './services/auth';
import { StoreData, Product, Partner, Transaction, Employee, TransactionType, Category } from './types';

// Main App Content (when logged in)
const AppContent: React.FC = () => {
  const { adminData, storeId, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [data, setData] = useState<StoreData>({ products: [], partners: [], employees: [], transactions: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initData = async () => {
      try {
        setIsLoading(true);
        // Use storeId for multi-tenant data
        const initialData = await getStoreData(storeId || undefined);
        setData(initialData);
        setError(null);

        // Subscribe to real-time updates with storeId
        unsubscribe = subscribeToStoreData((newData) => {
          setData(newData);
        }, storeId || undefined);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) {
      initData();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [storeId]);

  const updateData = async (newData: StoreData) => {
    setData(newData);
    // Pass storeId for multi-tenant save
    await saveStoreData(newData, storeId || undefined);
  };

  // Helper Wrappers
  const updateProducts = (products: Product[]) => updateData({ ...data, products });
  const updatePartners = (partners: Partner[]) => updateData({ ...data, partners });
  const updateEmployees = (employees: Employee[]) => updateData({ ...data, employees });
  const updateCategories = (categories: Category[]) => updateData({ ...data, categories });

  // Generic Transaction Handler (Used for Expenses, Salaries, Supply, Debt Payment)
  const addTransaction = (transaction: Transaction) => {
    updateData({
      ...data,
      transactions: [transaction, ...data.transactions]
    });
  };

  // POS Transaction Handler (Complex logic for stock & partners)
  const handlePosTransaction = (transaction: Transaction, updatedProducts: Product[], updatedCustomer?: Partner) => {
    let newPartners = [...data.partners];
    if (updatedCustomer) {
      newPartners = newPartners.map(p => p.id === updatedCustomer.id ? updatedCustomer : p);
    }
    updateData({
      ...data,
      products: updatedProducts,
      partners: newPartners,
      transactions: [transaction, ...data.transactions]
    });
  };

  // Supply Transaction Handler
  const handleSupplyTransaction = (transaction: Transaction, updatedProducts: Product[], updatedSupplier?: Partner) => {
    let newPartners = [...data.partners];
    if (updatedSupplier) {
      newPartners = newPartners.map(p => p.id === updatedSupplier.id ? updatedSupplier : p);
    }
    updateData({
      ...data,
      products: updatedProducts,
      partners: newPartners,
      transactions: [transaction, ...data.transactions]
    });
  };

  const deleteTransaction = async (id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    if (!tx) return;

    let newProducts = [...data.products];
    let newPartners = [...data.partners];

    // Reverse Effects based on Type
    if (tx.type === TransactionType.SALE) {
      // Return stock
      if (tx.items) {
        tx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          if (p) p.stock += item.qty;
        });
      }
      // Revert Debt if applicable
      if (tx.paymentMethod === 'DEBT' && tx.partnerId) {
        const p = newPartners.find(part => part.id === tx.partnerId);
        if (p) p.balance -= tx.totalAmount;
      }
    } else if (tx.type === TransactionType.PURCHASE) {
      // Reduce Stock
      if (tx.items) {
        tx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          if (p) p.stock -= item.qty;
        });
      }
      // Revert Debt if applicable (We owed them, so canceling means we owe less, i.e., add to balance because balance is negative)
      if (tx.paymentMethod === 'DEBT' && tx.partnerId) {
        const p = newPartners.find(part => part.id === tx.partnerId);
        if (p) p.balance += tx.totalAmount;
      }
    } else if (tx.type === TransactionType.DEBT_PAYMENT && tx.partnerId) {
      // Increase Debt again (cancel payment)
      const p = newPartners.find(part => part.id === tx.partnerId);
      if (p) p.balance += tx.totalAmount;
    }

    const newTransactions = data.transactions.filter(t => t.id !== id);
    await updateData({
      ...data,
      products: newProducts,
      partners: newPartners,
      transactions: newTransactions
    });
  };

  const editTransaction = async (oldTx: Transaction, newTx: Transaction) => {
    const newTransactions = data.transactions.map(t => t.id === oldTx.id ? newTx : t);
    await updateData({ ...data, transactions: newTransactions });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh] flex-col">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Ma'lumotlar yuklanmoqda...</h2>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-[60vh] flex-col">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Xatolik</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={data.products} transactions={data.transactions} partners={data.partners} employees={data.employees} />;
      case 'pos':
        return <POS products={data.products} customers={data.partners.filter(p => p.type === 'CUSTOMER')} onTransaction={handlePosTransaction} onUpdateProducts={updateProducts} categories={data.categories || []} onUpdateCategories={updateCategories} />;
      case 'supply':
        return <Supply products={data.products} suppliers={data.partners.filter(p => p.type === 'SUPPLIER')} onTransaction={handleSupplyTransaction} onUpdateProducts={updateProducts} categories={data.categories || []} onUpdateCategories={updateCategories} />;
      case 'inventory':
        return <Inventory products={data.products} onUpdateProducts={updateProducts} categories={data.categories || []} onUpdateCategories={updateCategories} />;
      case 'history':
        return <History transactions={data.transactions} onDeleteTransaction={deleteTransaction} onEditTransaction={editTransaction} />;
      case 'reports':
        return <Reports transactions={data.transactions} products={data.products} />;
      case 'crm':
        return <CRM partners={data.partners} onUpdatePartners={updatePartners} onAddTransaction={addTransaction} />;
      case 'employees':
        return <Employees employees={data.employees} onUpdateEmployees={updateEmployees} onPaySalary={addTransaction} />;
      case 'expenses':
        return <Expenses onAddExpense={addTransaction} />;
      case 'ai':
        return <AIAnalyst data={data} />;
      case 'settings':
        return <Settings adminData={adminData} onUpdateProfile={handleUpdateProfile} onLogout={logout} />;
      default:
        return <Dashboard products={data.products} transactions={data.transactions} partners={data.partners} employees={data.employees} />;
    }
  };

  const handleUpdateProfile = async (newName: string) => {
    if (user && adminData) {
      await updateAdminStoreName(user.uid, newName);
      // Local update is handled by subscription or page refresh, but we can force reload if needed
      // Actually, since we subscribe to auth state changes in many places, it might reflect, 
      // but adminData comes from useAuth which fetches once.
      // Ideally we would update the local context state, but useAuth might not expose a setter.
      // For now, let's reload the page to ensure store name updates everywhere or trust the subscription?
      // AuthContext typically doesn't auto-reload adminData on firestore change unless subscribed.
      // Let's assume user accepts a refresh or we can try to force it.
      // For simplicity: reload page after 1s or just let the user see it on next login?
      // Better: force a reload or re-fetch in AuthContext.
      // Since we don't have access to setAdminData here easily, we rely on page reload for now.
      window.location.reload();
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Bosh Sahifa',
      pos: 'Savdo (POS)',
      supply: 'Kirim (Xarid)',
      inventory: 'Omborxona',
      history: 'Tarix',
      reports: 'Hisobotlar',
      crm: 'Hamkorlar',
      employees: 'Hodimlar',
      expenses: 'Harajatlar',
      ai: 'AI Yordamchi',
      settings: 'Sozlamalar'
    };
    return titles[activeTab] || 'ZiyoBook';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <header className="bg-white shadow-sm border-b border-slate-200 p-4 sticky top-0 z-20 flex justify-between items-center no-print">
          <div className="flex items-center">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 mr-4 text-slate-600 lg:hidden hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{getTitle()}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-bold text-slate-800">{adminData?.storeName || 'Do\'kon'}</p>
              <p className="text-xs text-slate-500">{adminData?.email}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
              {adminData?.storeName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {/* Logout moved to Settings page */}
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Main App with Auth Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
};

// Auth Gate - decides what to show
const AuthGate: React.FC = () => {
  const { user, loading, adminData } = useAuth();

  // Check for super admin route
  const isSuperAdminRoute = window.location.search.includes('superadmin=true');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!user || !adminData) {
    return <Login />;
  }

  // Super Admin Panel (add ?superadmin=true to URL)
  if (isSuperAdminRoute && adminData?.isSuperAdmin) {
    return <SuperAdmin />;
  }

  // Logged in - show app
  return <AppContent />;
};

export default App;