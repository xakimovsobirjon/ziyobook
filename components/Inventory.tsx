import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { generateId } from '../services/storage';

interface InventoryProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    priceBuy: 0,
    priceSell: 0,
    stock: 0,
    minStock: 5,
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        priceBuy: 0,
        priceSell: 0,
        stock: 0,
        minStock: 5,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.priceSell) return;

    if (editingProduct) {
      // Update
      const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p);
      onUpdateProducts(updated);
    } else {
      // Create
      const newProduct: Product = {
        id: generateId(),
        ...formData as Product
      };
      onUpdateProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Rostdan ham o'chirmoqchimisiz?")) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Omborxona</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Yangi Kitob
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Kitob nomi yoki kategoriya bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-medium">Nomi</th>
                <th className="p-3 font-medium">Kategoriya</th>
                <th className="p-3 font-medium text-right">Tannarx</th>
                <th className="p-3 font-medium text-right">Sotuv</th>
                <th className="p-3 font-medium text-center">Qoldiq</th>
                <th className="p-3 font-medium text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{product.name}</td>
                  <td className="p-3 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">{product.category}</span>
                  </td>
                  <td className="p-3 text-right text-slate-600">{product.priceBuy.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium text-emerald-600">{product.priceSell.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className={`${product.stock <= product.minStock ? 'text-red-500 font-bold' : 'text-slate-800'}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.minStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleOpenModal(product)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-slate-400">Kitoblar topilmadi</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? "Kitobni tahrirlash" : "Yangi kitob qo'shish"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kitob nomi</label>
                <input 
                  type="text" required 
                  className="w-full border rounded-lg p-2"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
                <input 
                  type="text" required 
                  className="w-full border rounded-lg p-2"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tannarx</label>
                  <input 
                    type="number" required 
                    className="w-full border rounded-lg p-2"
                    value={formData.priceBuy} onChange={e => setFormData({...formData, priceBuy: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sotuv Narxi</label>
                  <input 
                    type="number" required 
                    className="w-full border rounded-lg p-2"
                    value={formData.priceSell} onChange={e => setFormData({...formData, priceSell: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qoldiq</label>
                  <input 
                    type="number" required 
                    className="w-full border rounded-lg p-2"
                    value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Chegara</label>
                  <input 
                    type="number" required 
                    className="w-full border rounded-lg p-2"
                    value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;