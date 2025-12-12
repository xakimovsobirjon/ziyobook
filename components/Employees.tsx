import React, { useState } from 'react';
import { Employee, Transaction, TransactionType } from '../types';
import { User, Plus, DollarSign, Trash2 } from 'lucide-react';
import { generateId } from '../services/storage';

interface EmployeesProps {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onPaySalary: (transaction: Transaction) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onUpdateEmployees, onPaySalary }) => {
  const [showModal, setShowModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', role: '', phone: '', salary: 0 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const emp: Employee = {
      id: generateId(),
      name: newEmployee.name!,
      role: newEmployee.role!,
      phone: newEmployee.phone!,
      salary: Number(newEmployee.salary)
    };
    onUpdateEmployees([...employees, emp]);
    setShowModal(false);
    setNewEmployee({ name: '', role: '', phone: '', salary: 0 });
  };

  const handlePaySalary = (employee: Employee) => {
    const amount = Number(prompt(`${employee.name}ga qancha maosh to'lamoqchisiz?`, employee.salary.toString()));
    if (!amount || amount <= 0) return;

    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.SALARY,
      totalAmount: amount,
      employeeId: employee.id,
      note: `Ish haqi: ${employee.name}`
    };
    onPaySalary(transaction);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Hodimni o'chirmoqchimisiz?")) {
      onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Hodimlar</h2>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Hodim Qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                  <p className="text-slate-500 text-sm">{emp.role}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(emp.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Telefon:</span>
                <span className="font-medium">{emp.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Oylik maoshi:</span>
                <span className="font-medium">{emp.salary.toLocaleString()} so'm</span>
              </div>
            </div>
            <button 
              onClick={() => handlePaySalary(emp)}
              className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2 rounded-lg font-medium flex items-center justify-center"
            >
              <DollarSign className="w-4 h-4 mr-2" /> Maosh To'lash
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Yangi Hodim</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" placeholder="F.I.SH" required className="w-full border p-2 rounded" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              <input type="text" placeholder="Lavozimi" required className="w-full border p-2 rounded" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} />
              <input type="text" placeholder="Telefon" required className="w-full border p-2 rounded" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} />
              <input type="number" placeholder="Oylik maoshi" required className="w-full border p-2 rounded" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: Number(e.target.value)})} />
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;