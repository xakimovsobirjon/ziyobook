import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { Trash2, Calendar, ArrowUpRight, ArrowDownLeft, Wallet, UserCheck, Eye, X, Pencil, Plus, Minus, Loader2, Check, Printer, ShoppingCart } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (oldTx: Transaction, newTx: Transaction) => void;
}

const History: React.FC<HistoryProps> = ({ transactions, onDeleteTransaction, onEditTransaction }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<Transaction | null>(null);

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

  const handlePrint = () => {
    window.print();
  };

  /* Edit State */
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  /* Edit Form State */
  const [editForm, setEditForm] = useState<{
    date: string;
    note: string;
    totalAmount: number;
    items: Array<{ id: string; name: string; price: number; qty: number }>;
  }>({ date: '', note: '', totalAmount: 0, items: [] });

  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      date: new Date(transaction.date).toISOString().slice(0, 16), // datetime-local format
      note: transaction.note || '',
      totalAmount: transaction.totalAmount || 0,
      // For PURCHASE transactions, use priceBuy (cost price), for SALE use priceSell
      items: transaction.items ? transaction.items.map(i => ({
        ...i,
        price: transaction.type === TransactionType.PURCHASE ? i.priceBuy : i.priceSell
      })) : []
    });
  };

  const handleSaveEdit = () => {
    if (!editingTransaction || !onEditTransaction) return;

    const txType = editingTransaction.type;

    // For non-item transactions (EXPENSE, SALARY, DEBT_PAYMENT), use the direct totalAmount
    if (txType === TransactionType.EXPENSE || txType === TransactionType.SALARY || txType === TransactionType.DEBT_PAYMENT) {
      const newTx: Transaction = {
        ...editingTransaction,
        date: new Date(editForm.date).toISOString(),
        note: editForm.note,
        totalAmount: editForm.totalAmount
      };
      onEditTransaction(editingTransaction, newTx);
      setEditingTransaction(null);
      return;
    }

    // For SALE and PURCHASE, calculate from items
    const isPurchase = txType === TransactionType.PURCHASE;

    const newItems = editForm.items.map(item => {
      const originalItem = editingTransaction.items?.find(i => i.id === item.id);
      if (isPurchase) {
        return {
          ...item,
          priceBuy: item.price,
          priceSell: originalItem?.priceSell || 0
        };
      } else {
        return {
          ...item,
          priceSell: item.price,
          priceBuy: originalItem?.priceBuy || 0
        };
      }
    });

    const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const profit = isPurchase ? 0 : newItems.reduce((sum, item) => sum + ((item.priceSell - item.priceBuy) * item.qty), 0);

    const newTx: Transaction = {
      ...editingTransaction,
      date: new Date(editForm.date).toISOString(),
      note: editForm.note,
      items: newItems,
      totalAmount: totalAmount,
      profit: profit
    };

    onEditTransaction(editingTransaction, newTx);
    setEditingTransaction(null);
  };

  const updateItemQty = (id: string, delta: number) => {
    const newItems = editForm.items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0); // Remove items with 0 qty

    setEditForm({ ...editForm, items: newItems });
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    const newItems = editForm.items.map(item => {
      if (item.id === id) {
        return { ...item, price: newPrice };
      }
      return item;
    });
    setEditForm({ ...editForm, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tarix</h2>
        <select
          className="border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
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

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
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
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {new Date(t.date).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getIcon(t.type)}
                      <span className="font-medium text-slate-700 dark:text-slate-200">{getLabel(t.type)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 max-w-md">
                    {t.items && t.items.length > 0 ? (
                      <div className="text-sm">
                        {t.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                      </div>
                    ) : (
                      <span className="italic">{t.note || '-'}</span>
                    )}
                  </td>
                  <td className={`p-4 text-right font-bold ${[TransactionType.SALE, TransactionType.DEBT_PAYMENT].includes(t.type) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'
                    }`}>
                    {t.totalAmount.toLocaleString()} so'm
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {t.type === TransactionType.SALE && (
                        <button
                          onClick={() => setPrintReceipt(t)}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                          title="Chek chop etish"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTransaction(t)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onEditTransaction && (
                        <button
                          onClick={() => startEditing(t)}
                          className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="O'chirish (Bekor qilish)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* View Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                {getIcon(selectedTransaction.type)}
                {getLabel(selectedTransaction.type)} tafsilotlari
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content same as before... */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Sana</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {new Date(selectedTransaction.date).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">ID</span>
                  <span className="font-mono text-sm text-slate-800 dark:text-white">{selectedTransaction.id}</span>
                </div>
                {/* ... existing details ... */}
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">To'lov Turi</span>
                  <span className="font-medium text-slate-800 dark:text-white">{selectedTransaction.paymentMethod || '-'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Jami Summa</span>
                  <span className="font-medium text-slate-800 dark:text-white">{selectedTransaction.totalAmount.toLocaleString()} so'm</span>
                </div>
              </div>
              {/* ... */}
              {selectedTransaction.items && (
                <div>
                  <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-200">Mahsulotlar</h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="p-3 text-left">Nomi</th>
                          <th className="p-3 text-right">
                            {selectedTransaction.type === TransactionType.PURCHASE ? 'Kelish narxi' : 'Sotuv narxi'}
                          </th>
                          <th className="p-3 text-center">Soni</th>
                          <th className="p-3 text-right">Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, idx) => {
                          // For PURCHASE use priceBuy (cost), for SALE use priceSell
                          const itemPrice = selectedTransaction.type === TransactionType.PURCHASE
                            ? item.priceBuy
                            : item.priceSell;
                          return (
                            <tr key={idx}>
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-right">{itemPrice.toLocaleString()} so'm</td>
                              <td className="p-3 text-center">{item.qty}</td>
                              <td className="p-3 text-right">
                                {(itemPrice * item.qty).toLocaleString()} so'm
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Pencil className="w-5 h-5 text-amber-500" />
                Tranzaksiyani tahrirlash
              </h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sana</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Izoh</label>
                <textarea
                  className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={editForm.note}
                  onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                />
              </div>

              {/* Summa input for EXPENSE, SALARY, DEBT_PAYMENT */}
              {editingTransaction && (
                editingTransaction.type === TransactionType.EXPENSE ||
                editingTransaction.type === TransactionType.SALARY ||
                editingTransaction.type === TransactionType.DEBT_PAYMENT
              ) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summa (so'm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={editForm.totalAmount}
                      onChange={e => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })}
                    />
                  </div>
                )}

              {editForm.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mahsulotlar ({editingTransaction?.type === TransactionType.PURCHASE ? 'Kelish narxi' : 'Sotuv narxi'} va Sonini o'zgartirish)
                  </label>
                  <div className="border rounded-lg overflow-hidden dark:border-slate-600">
                    <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="p-3 text-left">Mahsulot</th>
                          <th className="p-3 text-center">
                            {editingTransaction?.type === TransactionType.PURCHASE ? 'Kelish narxi' : 'Sotuv narxi'}
                          </th>
                          <th className="p-3 text-center">Soni</th>
                          <th className="p-3 text-center">Jami</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-700">
                        {editForm.items.map(item => (
                          <tr key={item.id}>
                            <td className="p-3">{item.name}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                className="w-24 border rounded p-1 text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.id, Number(e.target.value))}
                              />
                            </td>
                            <td className="p-3 flex justify-center items-center gap-2">
                              <button
                                onClick={() => updateItemQty(item.id, -1)}
                                className="p-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold">{item.qty}</span>
                              <button
                                onClick={() => updateItemQty(item.id, 1)}
                                className="p-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </td>
                            <td className="p-3 text-center">{(item.price * item.qty).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <span>Muvaffaqiyatli o'chirildi!</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tranzaksiyani o'chirish</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Bu amalni bekor qilmoqchimisiz? Ombor va kassa qayta hisoblanadi.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={async () => {
                    if (!deleteConfirm) return;
                    setIsSaving(true);
                    try {
                      await onDeleteTransaction(deleteConfirm);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    } catch (error) {
                      console.error('O\'chirishda xatolik:', error);
                    } finally {
                      setIsSaving(false);
                      setDeleteConfirm(null);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      O'chirilmoqda...
                    </>
                  ) : (
                    "Ha, o'chirish"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {printReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none print:bg-white print:!bg-white">
            {/* Header */}
            <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-6 text-center print:bg-white print:text-black print:border-b-2 print:border-black print:p-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 print:hidden">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-widest print:text-black print:text-xl">ZiyoBook</h1>
              <p className="text-emerald-100 dark:text-emerald-200 text-sm mt-1 print:text-black">Kitob do'koni</p>
            </div>

            {/* Receipt Info */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-center print:border-b print:border-gray-300 print:py-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm print:text-black">
                {new Date(printReceipt.date).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-1 font-mono print:text-black">
                Chek: #{printReceipt.id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Items */}
            <div className="px-6 py-4 space-y-3 max-h-60 overflow-y-auto print:max-h-none print:overflow-visible print:py-2 print:bg-white">
              {printReceipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-700 last:border-0 print:border-gray-300 print:bg-white">
                  <div className="flex-1">
                    <p className="text-slate-800 dark:text-white font-medium text-sm print:!text-black">{item.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs print:!text-gray-700">
                      {item.priceSell.toLocaleString()} × {item.qty} dona
                    </p>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white print:!text-black">
                    {(item.priceSell * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mx-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 print:!bg-white print:border-2 print:border-black print:rounded-none print:mx-4">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold print:!text-black">Jami summa:</span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 print:!text-black">{printReceipt.totalAmount.toLocaleString()} <span className="text-sm print:!text-black">so'm</span></span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 print:!text-black print:border-gray-400">
                <span className="print:!text-black">To'lov turi:</span>
                <span className="font-medium print:!text-black">
                  {printReceipt.paymentMethod === PaymentMethod.CASH ? '💵 Naqd' :
                    printReceipt.paymentMethod === PaymentMethod.CARD ? '💳 Karta' : '📝 Nasiya'}
                </span>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center py-4 px-6 print:py-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm print:text-black">
                ✨ Xaridingiz uchun rahmat!
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 print:text-gray-700">
                Har doim biz bilan bo'ling
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-100 dark:bg-slate-900/50 flex gap-3 no-print">
              <button
                onClick={() => setPrintReceipt(null)}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
              >
                Yopish
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                🖨️ Chop etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;