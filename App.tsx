import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import CRM from './components/CRM';
import AIAnalyst from './components/AIAnalyst';
import { getStoreData, saveStoreData } from './services/storage';
import { StoreData, Product, Partner, Transaction } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [data, setData] = useState<StoreData>({ products: [], partners: [], transactions: [] });

  // Load data on mount
  useEffect(() => {
    setData(getStoreData());
  }, []);

  // Update Products
  const updateProducts = (products: Product[]) => {
    const newData = { ...data, products };
    setData(newData);
    saveStoreData(newData);
  };

  // Update Partners
  const updatePartners = (partners: Partner[]) => {
    const newData = { ...data, partners };
    setData(newData);
    saveStoreData(newData);
  };

  // Handle new transaction (from POS)
  const handleTransaction = (transaction: Transaction, updatedProducts: Product[], updatedCustomer?: Partner) => {
    let newPartners = [...data.partners];
    
    // If a customer was involved and balance changed
    if (updatedCustomer) {
      newPartners = newPartners.map(p => p.id === updatedCustomer.id ? updatedCustomer : p);
    }

    const newData = {
      ...data,
      products: updatedProducts,
      partners: newPartners,
      transactions: [transaction, ...data.transactions]
    };

    setData(newData);
    saveStoreData(newData);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'inventory':
        return <Inventory products={data.products} onUpdateProducts={updateProducts} />;
      case 'pos':
        return <POS products={data.products} customers={data.partners} onTransaction={handleTransaction} />;
      case 'partners':
        return <CRM partners={data.partners} onUpdatePartners={updatePartners} />;
      case 'reports':
        // Reuse dashboard for now, or build more detailed tables
        return <Dashboard data={data} />;
      case 'ai':
        return <AIAnalyst data={data} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 p-4 sticky top-0 z-20 flex justify-between items-center no-print">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 mr-4 text-slate-600 lg:hidden hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab === 'pos' ? 'Savdo nuqtasi' : 
               activeTab === 'inventory' ? 'Omborxona' :
               activeTab === 'partners' ? 'Hamkorlar' :
               activeTab === 'ai' ? 'Sun\'iy Intellekt' : 'Bosh sahifa'}
            </h1>
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

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;