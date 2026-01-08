import React, { useState } from 'react';
import { Partner, Transaction, TransactionType } from '../types';
import { Plus, Phone, User, Trash2, CreditCard, Check, Loader2 } from 'lucide-react';
import { generateId } from '../services/storage';

interface CRMProps {
  partners: Partner[];
  onUpdatePartners: (partners: Partner[]) => Promise<void>;
  onAddTransaction: (transaction: Transaction) => void;
}

const CRM: React.FC<CRMProps> = ({ partners, onUpdatePartners, onAddTransaction }) => {
  const [activeType, setActiveType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [showModal, setShowModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', phone: '', balance: 0 });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredPartners = partners.filter(p => p.type === activeType);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const partner: Partner = {
        id: generateId(),
        type: activeType,
        name: newPartner.name,
        phone: newPartner.phone,
        balance: activeType === 'CUSTOMER' ? 0 : 0
      };
      await onUpdatePartners([...partners, partner]);
      setShowModal(false);
      setNewPartner({ name: '', phone: '', balance: 0 });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      setIsSaving(true);
      await onUpdatePartners(partners.filter(p => p.id !== deleteConfirm));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const handlePayment = async (partner: Partner) => {
    const debt = partner.balance;
    if (debt <= 0) return alert("Mijozda qarz yo'q!");

    const amountStr = prompt(`Qarzni to'lash (${debt.toLocaleString()} so'm). Summani kiriting:`, debt.toString());
    const amount = Number(amountStr);

    if (!amount || amount <= 0) return;

    // 1. Update Partner Balance
    const updatedPartners = partners.map(p => {
      if (p.id === partner.id) return { ...p, balance: p.balance - amount };
      return p;
    });
    await onUpdatePartners(updatedPartners);

    // 2. Create Transaction
    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.DEBT_PAYMENT,
      totalAmount: amount,
      partnerId: partner.id,
      note: `${partner.name} - Qarz to'lovi`
    };
    onAddTransaction(transaction);
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          <span>Muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveType('CUSTOMER')}
          className={`pb-3 px-4 font-medium transition-colors ${activeType === 'CUSTOMER' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}
        >
          Mijozlar
        </button>
        <button
          onClick={() => setActiveType('SUPPLIER')}
          className={`pb-3 px-4 font-medium transition-colors ${activeType === 'SUPPLIER' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}
        >
          Ta'minotchilar
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">
          {activeType === 'CUSTOMER' ? "Mijozlar Ro'yxati" : "Ta'minotchilar Ro'yxati"}
        </h2>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map(partner => (
          <div key={partner.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                  <User className="text-slate-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{partner.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 mr-1" /> {partner.phone}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDeleteClick(partner.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Balans:</span>
                <span className={`font-bold ${partner.balance > 0 ? 'text-red-500' : partner.balance < 0 ? 'text-blue-500' : 'text-slate-800'}`}>
                  {partner.balance > 0 ? `Qarzi: ${partner.balance.toLocaleString()}` :
                    partner.balance < 0 ? `Haqimiz: ${Math.abs(partner.balance).toLocaleString()}` : '0'} so'm
                </span>
              </div>
              {activeType === 'CUSTOMER' && partner.balance > 0 && (
                <button
                  onClick={() => handlePayment(partner)}
                  className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                >
                  <CreditCard className="w-3 h-3 mr-2" /> Qarzni to'lash
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredPartners.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">Ro'yxat bo'sh</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Yangi {activeType === 'CUSTOMER' ? 'Mijoz' : "Ta'minotchi"}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">F.I.SH / Nomi</label>
                <input
                  required
                  type="text"
                  className="w-full border p-2 rounded-lg"
                  value={newPartner.name}
                  onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Telefon</label>
                <input
                  required
                  type="text"
                  className="w-full border p-2 rounded-lg"
                  value={newPartner.phone}
                  onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })}
                />
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  'Saqlash'
                )}
              </button>
              <button type="button" onClick={() => setShowModal(false)} disabled={isSaving} className="w-full text-slate-500 py-2 disabled:opacity-50">Bekor qilish</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">O'chirishni tasdiqlang</h3>
              <p className="text-slate-600 mb-6">Rostdan ham bu hamkorni o'chirmoqchimisiz?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleDeleteConfirm}
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
    </div>
  );
};

export default CRM;