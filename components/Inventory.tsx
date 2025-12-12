import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, AlertCircle, Image as ImageIcon, ScanBarcode, Upload, X } from 'lucide-react';
import { generateId, convertFileToBase64 } from '../services/storage';

interface InventoryProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Product Form
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: '', priceBuy: 0, priceSell: 0, stock: 0, minStock: 5, imageUrl: '', barcode: ''
  });

  // PRODUCT MODAL HANDLERS
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', priceBuy: 0, priceSell: 0, stock: 0, minStock: 5, imageUrl: '', barcode: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.priceSell) return;

    if (editingProduct) {
      const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p);
      onUpdateProducts(updated);
    } else {
      const newProduct: Product = { id: generateId(), ...formData as Product };
      onUpdateProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Rostdan ham o'chirmoqchimisiz?")) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setFormData({ ...formData, imageUrl: base64 });
      } catch (error) {
        alert("Rasm yuklashda xatolik bo'ldi");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
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
            placeholder="Kitob nomi, kategoriya yoki shtrix-kod..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-medium">Rasm</th>
                <th className="p-3 font-medium">Shtrix-kod</th>
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
                  <td className="p-3">
                    <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-400 w-5 h-5" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-500 font-mono">
                    {product.barcode || '-'}
                  </td>
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
                      <button onClick={() => handleOpenModal(product)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Tahrirlash">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="O'chirish">
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

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? "Kitobni tahrirlash" : "Yangi kitob qo'shish"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shtrix-kod (Skaner)</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="w-full border rounded-lg p-2 pl-9" 
                        value={formData.barcode || ''} 
                        onChange={e => setFormData({...formData, barcode: e.target.value})} 
                        placeholder="Skaner qiling..."
                    />
                    <ScanBarcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kitob rasmi</label>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <div className="flex items-center gap-3">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors border border-slate-300"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Rasm yuklash
                        </button>
                        {formData.imageUrl && (
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, imageUrl: ''})}
                                className="text-red-500 hover:text-red-700 p-2"
                                title="Rasmni o'chirish"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                  </div>
                  <div className="w-20 h-28 bg-slate-100 rounded border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kitob nomi</label>
                <input type="text" required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
                <input type="text" required className="w-full border rounded-lg p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tannarx</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={formData.priceBuy} onChange={e => setFormData({...formData, priceBuy: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sotuv Narxi</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={formData.priceSell} onChange={e => setFormData({...formData, priceSell: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qoldiq</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Chegara</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;