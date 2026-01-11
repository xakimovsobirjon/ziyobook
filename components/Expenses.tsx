import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Wallet, Plus, Check } from 'lucide-react';
import { generateId } from '../services/storage';
import { formatPrice, parsePrice } from '../utils';

interface ExpensesProps {
  onAddExpense: (transaction: Transaction) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !note) return;

    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE,
      totalAmount: Number(amount),
      note: note
    };

    onAddExpense(transaction);
    setAmount('');
    setNote('');

    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <span>Harajat muvaffaqiyatli saqlandi!</span>
        </div>
      )}


      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 dark:text-red-400">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summa</label>
            <input
              type="text"
              required
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              placeholder="0"
              value={formatPrice(amount)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9\s]/g, '');
                if (val.trim() === '') setAmount('');
                else setAmount(parsePrice(val).toString());
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Izoh (Sabab)</label>
            <input
              type="text"
              required
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              placeholder="Masalan: Ijara haqi, Svet, Tushlik"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-lg transform active:scale-95 transition-all">
            Harajatni Saqlash
          </button>
        </form>
      </div>
      <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
        Barcha kiritilgan harajatlar "Tarix" va "Hisobotlar" bo'limida ko'rinadi.
      </p>
    </div>
  );
};

export default Expenses;