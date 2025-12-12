import React, { useState } from 'react';
import { Transaction, TransactionType, Product, Partner } from '../types';
import { Trash2, Calendar, ArrowUpRight, ArrowDownLeft, Wallet, UserCheck } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ transactions, onDeleteTransaction }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  
  const filtered = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SALE: return <ArrowUpRight className="text-emerald-500" />;
      case TransactionType.PURCHASE: return <ArrowDownLeft className="text-blue-500" />;
      case TransactionType.EXPENSE: return <Wallet className="text-red-500" />;
      case TransactionType.SALARY: return <Wallet className="text-purple-500" />;
      case TransactionType.DEBT_PAYMENT: return <UserCheck className="text-emerald-600" />;
      default: return <Calendar />;
    }
  };

  const getLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SALE: return 'Sotuv';
      case TransactionType.PURCHASE: return 'Kirim (Xarid)';
      case TransactionType.EXPENSE: return 'Harajat';
      case TransactionType.SALARY: return 'Ish haqi';
      case TransactionType.DEBT_PAYMENT: return 'Qarz to\'lovi';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tarix</h2>
        <select 
          className="border rounded-lg p-2 bg-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">Barchasi</option>
          <option value={TransactionType.SALE}>Sotuvlar</option>
          <option value={TransactionType.PURCHASE}>Kirimlar</option>
          <option value={TransactionType.EXPENSE}>Harajatlar</option>
          <option value={TransactionType.SALARY}>Ish haqi</option>
          <option value={TransactionType.DEBT_PAYMENT}>To'lovlar</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4 font-medium">Sana</th>
              <th className="p-4 font-medium">Turi</th>
              <th className="p-4 font-medium">Izoh / Mahsulotlar</th>
              <th className="p-4 font-medium text-right">Summa</th>
              <th className="p-4 font-medium text-center">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-slate-600 whitespace-nowrap">
                  {new Date(t.date).toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    {getIcon(t.type)}
                    <span className="font-medium text-slate-700">{getLabel(t.type)}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 max-w-md">
                   {t.items && t.items.length > 0 ? (
                     <div className="text-sm">
                       {t.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                     </div>
                   ) : (
                     <span className="italic">{t.note || '-'}</span>
                   )}
                </td>
                <td className={`p-4 text-right font-bold ${
                    [TransactionType.SALE, TransactionType.DEBT_PAYMENT].includes(t.type) ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                  {t.totalAmount.toLocaleString()} so'm
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => {
                        if(window.confirm("Bu amalni bekor qilmoqchimisiz? Ombor va kassa qayta hisoblanadi.")) {
                            onDeleteTransaction(t.id);
                        }
                    }} 
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="O'chirish (Bekor qilish)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Ma'lumot topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;