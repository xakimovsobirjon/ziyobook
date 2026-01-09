import React, { useState } from 'react';
import { Employee, Transaction, TransactionType } from '../types';
import { User, Plus, DollarSign, Trash2, Check, Loader2, Pencil, X } from 'lucide-react';
import { generateId } from '../services/storage';

interface EmployeesProps {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => Promise<void>;
  onPaySalary: (transaction: Transaction) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onUpdateEmployees, onPaySalary }) => {
  const [showModal, setShowModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', role: '', phone: '', salary: 0 });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Salary payment modal state
  const [salaryModal, setSalaryModal] = useState<Employee | null>(null);
  const [salaryAmount, setSalaryAmount] = useState<number>(0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingEmployee) {
        // Update existing
        const updatedEmployees = employees.map(emp =>
          emp.id === editingEmployee.id
            ? { ...emp, name: newEmployee.name!, role: newEmployee.role!, phone: newEmployee.phone!, salary: Number(newEmployee.salary) }
            : emp
        );
        await onUpdateEmployees(updatedEmployees);
      } else {
        // Create new
        const emp: Employee = {
          id: generateId(),
          name: newEmployee.name!,
          role: newEmployee.role!,
          phone: newEmployee.phone!,
          salary: Number(newEmployee.salary)
        };
        await onUpdateEmployees([...employees, emp]);
      }

      setShowModal(false);
      setNewEmployee({ name: '', role: '', phone: '', salary: 0 });
      setEditingEmployee(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewEmployee({ name: emp.name, role: emp.role, phone: emp.phone, salary: emp.salary });
    setShowModal(true);
  };

  const openSalaryModal = (employee: Employee) => {
    setSalaryModal(employee);
    setSalaryAmount(employee.salary);
  };

  const handlePaySalary = () => {
    if (!salaryModal || !salaryAmount || salaryAmount <= 0) return;

    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.SALARY,
      totalAmount: salaryAmount,
      employeeId: salaryModal.id,
      note: `Ish haqi: ${salaryModal.name}`
    };
    onPaySalary(transaction);
    setSalaryModal(null);
    setSalaryAmount(0);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      setIsSaving(true);
      await onUpdateEmployees(employees.filter(e => e.id !== deleteConfirm));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hodimlar</h2>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Hodim Qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="relative bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{emp.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{emp.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEditing(emp)}
                  className="text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 p-1"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(emp.id)} className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-1">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Telefon:</span>
                <span className="font-medium text-slate-800 dark:text-white">{emp.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Oylik maoshi:</span>
                <span className="font-medium text-slate-800 dark:text-white">{emp.salary.toLocaleString()} so'm</span>
              </div>
            </div>
            <button
              onClick={() => openSalaryModal(emp)}
              className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-2 rounded-lg font-medium flex items-center justify-center"
            >
              <DollarSign className="w-4 h-4 mr-2" /> Maosh To'lash
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => { setShowModal(false); setEditingEmployee(null); setNewEmployee({ name: '', role: '', phone: '', salary: 0 }); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
              {editingEmployee ? 'Hodimni tahrirlash' : 'Yangi Hodim'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" placeholder="F.I.SH" required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} />
              <input type="text" placeholder="Lavozimi" required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} />
              <input type="text" placeholder="Telefon" required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
              <input type="number" placeholder="Oylik maoshi" required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEmployee.salary} onChange={e => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })} />

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingEmployee(null); setNewEmployee({ name: '', role: '', phone: '', salary: 0 }); }} disabled={isSaving} className="px-4 py-2 text-slate-500 dark:text-slate-400 disabled:opacity-50">Bekor qilish</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    'Saqlash'
                  )}
                </button>
              </div>
            </form>
          </div>
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
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">O'chirishni tasdiqlang</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Rostdan ham bu hodimni o'chirmoqchimisiz?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50"
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

      {/* Salary Payment Modal */}
      {salaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Maosh To'lash</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">{salaryModal.name}ga qancha maosh to'lamoqchisiz?</p>
              <input
                type="number"
                className="w-full border rounded-lg p-3 text-center text-lg mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={salaryAmount}
                onChange={e => setSalaryAmount(Number(e.target.value))}
                placeholder="Summa kiriting"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setSalaryModal(null); setSalaryAmount(0); }}
                  className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handlePaySalary}
                  disabled={salaryAmount <= 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  To'lash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;