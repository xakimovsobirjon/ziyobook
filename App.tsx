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
import { getStoreData, saveStoreData, subscribeToStoreData } from './services/storage';
import { StoreData, Product, Partner, Transaction, Employee, TransactionType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [data, setData] = useState<StoreData>({ products: [], partners: [], employees: [], transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initData = async () => {
      try {
        setIsLoading(true);
        const initialData = await getStoreData();
        setData(initialData);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = subscribeToStoreData((newData) => {
          setData(newData);
        });
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setIsLoading(false);
      }
    };

    initData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const updateData = async (newData: StoreData) => {
    setData(newData);
    await saveStoreData(newData);
  };

  // Helper Wrappers
  const updateProducts = (products: Product[]) => updateData({ ...data, products });
  const updatePartners = (partners: Partner[]) => updateData({ ...data, partners });
  const updateEmployees = (employees: Employee[]) => updateData({ ...data, employees });

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
    let newProducts = [...data.products];
    let newPartners = [...data.partners];

    // 1. Revert Old Transaction Effects (Simplified version of delete logic)
    if (oldTx.type === TransactionType.SALE) {
      if (oldTx.items) {
        oldTx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          if (p) p.stock += item.qty;
        });
      }
      if (oldTx.paymentMethod === 'DEBT' && oldTx.partnerId) {
        const p = newPartners.find(part => part.id === oldTx.partnerId);
        if (p) p.balance -= oldTx.totalAmount;
      }
    } else if (oldTx.type === TransactionType.PURCHASE) {
      if (oldTx.items) {
        oldTx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          if (p) p.stock -= item.qty;
        });
      }
      if (oldTx.paymentMethod === 'DEBT' && oldTx.partnerId) {
        const p = newPartners.find(part => part.id === oldTx.partnerId);
        if (p) p.balance += oldTx.totalAmount;
      }
    }

    // 2. Apply New Transaction Effects
    if (newTx.type === TransactionType.SALE) {
      if (newTx.items) {
        newTx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          // Note: We are deducting from the ALREADY REVERTED stock
          if (p) p.stock -= item.qty;
        });
      }
      if (newTx.paymentMethod === 'DEBT' && newTx.partnerId) {
        const p = newPartners.find(part => part.id === newTx.partnerId);
        // Add new debt
        if (p) p.balance += newTx.totalAmount;
      }
    } else if (newTx.type === TransactionType.PURCHASE) {
      if (newTx.items) {
        newTx.items.forEach(item => {
          const p = newProducts.find(prod => prod.id === item.id);
          if (p) p.stock += item.qty;
        });
      }
      if (newTx.paymentMethod === 'DEBT' && newTx.partnerId) {
        const p = newPartners.find(part => part.id === newTx.partnerId);
        // Supplier debt means balance decreases (becomes more negative)
        if (p) p.balance -= newTx.totalAmount;
      }
    }

    // 3. Update Transaction in List
    const newTransactions = data.transactions.map(t => t.id === newTx.id ? newTx : t);

    await updateData({
      ...data,
      products: newProducts,
      partners: newPartners,
      transactions: newTransactions
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'inventory': return <Inventory products={data.products} onUpdateProducts={updateProducts} />;
      case 'pos': return <POS products={data.products} customers={data.partners} onTransaction={handlePosTransaction} />;
      case 'supply': return <Supply products={data.products} suppliers={data.partners} onTransaction={handleSupplyTransaction} onUpdateProducts={updateProducts} />;
      case 'partners': return <CRM partners={data.partners} onUpdatePartners={updatePartners} onAddTransaction={addTransaction} />;
      case 'employees': return <Employees employees={data.employees || []} onUpdateEmployees={updateEmployees} onPaySalary={addTransaction} />;
      case 'expenses': return <Expenses onAddExpense={addTransaction} />;
      case 'history': return <History transactions={data.transactions} onDeleteTransaction={deleteTransaction} onEditTransaction={editTransaction} />;
      case 'reports': return <Reports data={data} />;
      case 'ai': return <AIAnalyst data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      pos: 'Savdo nuqtasi', supply: 'Kirim (Xarid)', inventory: 'Omborxona', partners: 'Hamkorlar',
      ai: 'Sun\'iy Intellekt', history: 'Tarix', employees: 'Hodimlar',
      expenses: 'Harajatlar', reports: 'Hisobotlar'
    };
    return titles[activeTab] || 'Bosh sahifa';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Xatolik yuz berdi</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
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
              <p className="font-bold text-slate-800">Administrator</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
              A
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;