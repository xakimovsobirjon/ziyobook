import React from 'react';
import { LayoutDashboard, ShoppingCart, BookOpen, Users, BarChart3, Bot, Settings, History, Wallet, Briefcase, PackagePlus } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'pos', label: 'Savdo (POS)', icon: ShoppingCart },
    { id: 'supply', label: 'Kirim (Xarid)', icon: PackagePlus },
    { id: 'inventory', label: 'Omborxona', icon: BookOpen },
    { id: 'history', label: 'Tarix', icon: History },
    { id: 'crm', label: 'Hamkorlar', icon: Users },
    { id: 'employees', label: 'Hodimlar', icon: Briefcase },
    { id: 'expenses', label: 'Harajatlar', icon: Wallet },
    { id: 'ai', label: 'AI Yordamchi', icon: Bot },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-30 h-screen transition-transform transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-slate-900 text-white flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-center">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">ZiyoBook</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-4 py-3 text-slate-400 hover:text-white cursor-pointer">
            <Settings className="w-5 h-5 mr-3" />
            <span>Sozlamalar</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;