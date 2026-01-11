import React, { useState, useMemo } from 'react';
import { StoreData, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

interface ReportsProps {
  data: StoreData;
}

const Reports: React.FC<ReportsProps> = ({ data }) => {
  // Default: Last 7 days
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState(lastWeek.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const stats = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the end date fully

    const filtered = data.transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const totalSales = filtered
      .filter(t => t.type === TransactionType.SALE)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalProfit = filtered
      .filter(t => t.type === TransactionType.SALE)
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    const totalExpenses = filtered
      .filter(t => t.type === TransactionType.EXPENSE || t.type === TransactionType.SALARY)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalPurchases = filtered
      .filter(t => t.type === TransactionType.PURCHASE)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const netProfit = totalProfit - totalExpenses;

    return { totalSales, totalProfit, totalExpenses, totalPurchases, netProfit };
  }, [data.transactions, startDate, endDate]);

  const chartData = [
    { name: 'Sotuv', amount: stats.totalSales, fill: '#10b981' },
    { name: 'Xarid', amount: stats.totalPurchases, fill: '#3b82f6' },
    { name: 'Harajat', amount: stats.totalExpenses, fill: '#ef4444' },
    { name: 'Sof Foyda', amount: stats.netProfit, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              className="border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              className="border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Jami Savdo</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-500">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Brutto Foyda (Ustama)</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Jami Harajatlar</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sof Foyda</p>
          <p className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
            {stats.netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-96">
        <h3 className="font-bold text-slate-700 dark:text-white mb-4">Moliyaviy Ko'rsatkichlar Grafikasi</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(val) => `${val / 1000}k`} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(value: number) => [`${value.toLocaleString()} so'm`, 'Summa']}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;