import React, { useState } from 'react';
import { Partner, Transaction, TransactionType } from '../types';
import { Plus, Phone, User, Trash2, CreditCard } from 'lucide-react';
import { generateId } from '../services/storage';

interface CRMProps {
  partners: Partner[];
  onUpdatePartners: (partners: Partner[]) => void;
  onAddTransaction: (transaction: Transaction) => void;
}

const CRM: React.FC<CRMProps> = ({ partners, onUpdatePartners, onAddTransaction }) => {
  const [activeType, setActiveType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [showModal, setShowModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', phone: '', balance: 0 });

  const filteredPartners = partners.filter(p => p.type === activeType);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const partner: Partner = {
      id: generateId(),
      type: activeType,
      name: newPartner.name,
      phone: newPartner.phone,
      balance: activeType === 'CUSTOMER' ? 0 : 0 
    };
    onUpdatePartners([...partners, partner]);
    setShowModal(false);
    setNewPartner({ name: '', phone: '', balance: 0 });
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Hamkorni o'chirmoqchimisiz?")) {
      onUpdatePartners(partners.filter(p => p.id !== id));
    }
  };

  const handlePayment = (partner: Partner) => {
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
    onUpdatePartners(updatedPartners);

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
              <button onClick={() => handleDelete(partner.id)} className="text-slate-300 hover:text-red-500">
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
                  onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Telefon</label>
                <input 
                  required
                  type="text" 
                  className="w-full border p-2 rounded-lg"
                  value={newPartner.phone}
                  onChange={e => setNewPartner({...newPartner, phone: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg">Saqlash</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-500 py-2">Bekor qilish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;