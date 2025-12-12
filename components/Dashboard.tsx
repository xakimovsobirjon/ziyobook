import React, { useMemo } from 'react';
import { StoreData, TransactionType } from '../types';
import { DollarSign, Book, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps {
  data: StoreData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Daily Sales
    const dailySales = data.transactions
      .filter(t => t.type === TransactionType.SALE && t.date.startsWith(today))
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Monthly Profit
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyProfit = data.transactions
      .filter(t => t.type === TransactionType.SALE && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    // Low Stock
    const lowStockCount = data.products.filter(p => p.stock <= p.minStock).length;

    // Total Receivables (Customer Debts)
    const totalDebt = data.partners
      .filter(p => p.type === 'CUSTOMER')
      .reduce((sum, p) => sum + Math.max(0, p.balance), 0);

    return { dailySales, monthlyProfit, lowStockCount, totalDebt };
  }, [data]);

  const salesData = useMemo(() => {
    // Last 7 days sales
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = data.transactions
        .filter(t => t.type === TransactionType.SALE && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.totalAmount, 0);
      result.push({ name: dateStr.slice(5), amount });
    }
    return result;
  }, [data]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Boshqaruv Paneli</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Bugungi Savdo</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.dailySales.toLocaleString()} so'm</p>
          <p className="text-xs text-green-500 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Faol
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Oylik Sof Foyda</h3>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.monthlyProfit.toLocaleString()} so'm</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Mijozlar Qarzi</h3>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.totalDebt.toLocaleString()} so'm</p>
          <p className="text-xs text-slate-400 mt-1">Undirilishi kerak</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Kam Qolgan Tovar</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
          <p className="text-xs text-red-400 mt-1">Buyurtma berish kerak</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">So'nggi 7 kunlik savdo dinamikasi</h3>
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
    </div>
  );
};

export default Dashboard;
import { Users } from 'lucide-react'; // Added missing import