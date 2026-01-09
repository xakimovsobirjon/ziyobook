import React, { useMemo } from 'react';
import { Product, Partner, Transaction, Employee, TransactionType } from '../types';
import { DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  partners: Partner[];
  employees: Employee[];
}

const Dashboard: React.FC<DashboardProps> = ({ products = [], transactions = [], partners = [], employees = [] }) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Safe arrays
    const safeTransactions = transactions || [];
    const safeProducts = products || [];
    const safePartners = partners || [];

    // Daily Sales
    const dailySales = safeTransactions
      .filter(t => t.type === TransactionType.SALE && t.date?.startsWith(today))
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    // Monthly Profit
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyProfit = safeTransactions
      .filter(t => t.type === TransactionType.SALE && t.date?.startsWith(currentMonth))
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    // Low Stock
    const lowStockCount = safeProducts.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;

    // Total Receivables (Customer Debts)
    const totalDebt = safePartners
      .filter(p => p.type === 'CUSTOMER')
      .reduce((sum, p) => sum + Math.max(0, p.balance || 0), 0);

    return { dailySales, monthlyProfit, lowStockCount, totalDebt };
  }, [products, transactions, partners]);

  const salesData = useMemo(() => {
    const safeTransactions = transactions || [];
    // Last 7 days sales
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = safeTransactions
        .filter(t => t.type === TransactionType.SALE && t.date?.startsWith(dateStr))
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      result.push({ name: dateStr.slice(5), amount });
    }
    return result;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Boshqaruv Paneli</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bugungi Savdo</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.dailySales.toLocaleString()} so'm</p>
          <p className="text-xs text-green-500 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Faol
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Oylik Sof Foyda</h3>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.monthlyProfit.toLocaleString()} so'm</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mijozlar Qarzi</h3>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.totalDebt.toLocaleString()} so'm</p>
          <p className="text-xs text-slate-400 mt-1">Undirilishi kerak</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kam Qolgan Tovar</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
          <p className="text-xs text-red-400 mt-1">Buyurtma berish kerak</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">So'nggi 7 kunlik savdo dinamikasi</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [`${value.toLocaleString()} so'm`, 'Savdo']}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty state message for new stores */}
      {(products.length === 0 && transactions.length === 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Xush kelibsiz!</h3>
          <p className="text-blue-600 dark:text-blue-400">Bu sizning yangi do'koningiz. "Omborxona" bo'limidan mahsulot qo'shishingiz mumkin.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;