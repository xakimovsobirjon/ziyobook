import React, { useState, useRef } from 'react';
import { Product, Category } from '../types';
import { Plus, Search, Edit2, Trash2, AlertCircle, Image as ImageIcon, ScanBarcode, Upload, X, Loader2, Check, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateId, uploadProductImage } from '../services/storage';
import { formatPrice, parsePrice, isValidName } from '../utils';

interface InventoryProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => Promise<void>;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts, categories, onUpdateCategories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // product ID to delete
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Product Form
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: '', priceBuy: 0, priceSell: 0, stock: 0, minStock: 5, imageUrl: '', barcode: ''
  });
  const [nameError, setNameError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [priceBuyError, setPriceBuyError] = useState('');
  const [priceSellError, setPriceSellError] = useState('');

  // Category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Category tabs state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 200;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

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
    setNameError('');
    setCategoryError('');
    setPriceBuyError('');
    setPriceSellError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!isValidName(formData.name || '')) {
      setNameError("Kitob nomi kamida 3 ta harfdan iborat bo'lishi kerak!");
      hasError = true;
    }

    if (!formData.category) {
      setCategoryError("Kategoriya tanlanishi shart!");
      hasError = true;
    }

    if (!formData.priceBuy) {
      setPriceBuyError("Tannarx kiritilishi shart!");
      hasError = true;
    }

    if (!formData.priceSell) {
      setPriceSellError("Sotuv narxi kiritilishi shart!");
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (editingProduct) {
        const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p);
        await onUpdateProducts(updated);
      } else {
        const newProduct: Product = { id: generateId(), ...formData as Product };
        await onUpdateProducts([...products, newProduct]);
      }
      setIsModalOpen(false);
      setNameError('');
      setCategoryError('');
      setPriceBuyError('');
      setPriceSellError('');
      // Show success toast
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
      alert('Saqlashda xatolik yuz berdi!');
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
      await onUpdateProducts(products.filter(p => p.id !== deleteConfirm));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
      alert('O\'chirishda xatolik yuz berdi!');
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const imageUrl = await uploadProductImage(file);
        setFormData({ ...formData, imageUrl });
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Rasm yuklashda xatolik bo'ldi");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Category handlers
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState<string | null>(null);

  // Category handlers
  const handleDeleteCategoryClick = (catId: string) => {
    const productsInCategory = products.filter(p => p.category === catId);
    if (productsInCategory.length > 0) {
      alert(`Bu kategoriyada ${productsInCategory.length} ta mahsulot bor. Avval mahsulotlarni boshqa kategoriyaga o'tkazing.`);
      return;
    }
    setCategoryDeleteConfirm(catId);
    setCategoryMenuOpen(null);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryDeleteConfirm) return;
    onUpdateCategories(categories.filter(c => c.id !== categoryDeleteConfirm));
    if (selectedCategory === categoryDeleteConfirm) setSelectedCategory('all');
    setCategoryDeleteConfirm(null);
    // Show success toast logic reuse if possible or just rely on react reactivity
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    onUpdateCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: editCategoryName.trim() } : c));
    setEditingCategory(null);
    setEditCategoryName('');
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

      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Yangi Kitob
        </button>
      </div>

      {/* Category Tabs Navbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1">
        <div className="relative flex items-center">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 p-2 bg-gradient-to-r from-white dark:from-slate-800 via-white dark:via-slate-800 to-transparent hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 h-full flex items-center rounded-l-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex-1 w-0 flex items-center gap-2 overflow-x-auto px-12 py-2 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              Hammasi ({products.length})
            </button>
            {categories.map(cat => (
              <div key={cat.id} className="relative flex items-center">
                <div
                  className={`flex items-center rounded-lg overflow-hidden transition-colors border ${selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                >
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="px-4 py-2 text-sm font-medium whitespace-nowrap bg-transparent focus:outline-none"
                  >
                    {cat.name} ({products.filter(p => p.category === cat.id).length})
                  </button>
                  {/* Three-dot dropdown menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (categoryMenuOpen === cat.id) {
                        setCategoryMenuOpen(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 6, left: rect.right - 150 });
                        setCategoryMenuOpen(cat.id);
                      }
                    }}
                    className={`px-1.5 py-2 transition-colors border-l focus:outline-none h-full flex items-center ${selectedCategory === cat.id
                      ? 'border-emerald-500 hover:bg-emerald-700 text-emerald-100'
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-400 dark:text-slate-400'
                      }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                {/* Dropdown menu */}
                {categoryMenuOpen === cat.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCategoryMenuOpen(null)} />
                    <div
                      className="fixed z-50 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-[145px]"
                      style={{ top: menuPos.top, left: menuPos.left }}
                    >
                      <button
                        onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); setCategoryMenuOpen(null); }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" /> Tahrirlash
                      </button>
                      <button
                        onClick={() => { handleDeleteCategoryClick(cat.id); }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> O'chirish
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {/* Add New Category Button */}
            <button
              onClick={() => setShowNewCategory(true)}
              className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Yangi kategoriya
            </button>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 p-2 bg-gradient-to-l from-white dark:from-slate-800 via-white dark:via-slate-800 to-transparent hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 h-full flex items-center rounded-r-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Kitob nomi, kategoriya yoki shtrix-kod..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
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
                <tr key={product.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">
                    <div className="w-10 h-14 bg-slate-200 dark:bg-slate-600 rounded overflow-hidden flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-400 w-5 h-5" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {product.barcode || '-'}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-white">{product.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{categories.find(c => c.id === product.category)?.name || product.category}</span>
                  </td>
                  <td className="p-3 text-right text-slate-600 dark:text-slate-300">{product.priceBuy.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{product.priceSell.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className={`${product.stock <= product.minStock ? 'text-red-500 font-bold' : 'text-slate-800 dark:text-white'}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.minStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleOpenModal(product)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded" title="Tahrirlash">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded" title="O'chirish">
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
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    {editingProduct ? <Edit2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingProduct ? "Kitobni tahrirlash" : "Yangi kitob qo'shish"}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Barcha kerakli ma'lumotlarni kiriting</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Shtrix-kod</label>
                    <div className="relative">
                      <ScanBarcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 pl-11 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white transition-all"
                        value={formData.barcode || ''}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Skaner qiling yoki qo'lda kiriting..."
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kitob rasmi</label>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex items-center px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                        >
                          {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Yuklanmoqda...</>
                          ) : (
                            <><Upload className="w-4 h-4 mr-2" />Rasm yuklash</>
                          )}
                        </button>
                        {formData.imageUrl && !isUploading && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Rasmni o'chirish"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-24 h-32 bg-slate-100 dark:bg-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Book Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kitob nomi</label>
                    <input
                      type="text"
                      required
                      className={`w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white transition-all ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`}
                      value={formData.name}
                      onChange={e => { setFormData({ ...formData, name: e.target.value }); setNameError(''); }}
                      placeholder="Kitob nomini kiriting..."
                    />
                    {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kategoriya</label>
                    {showNewCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl p-3 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500"
                          placeholder="Yangi kategoriya nomi..."
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              const newCat: Category = { id: generateId(), name: newCategoryName.trim() };
                              onUpdateCategories([...categories, newCat]);
                              setFormData({ ...formData, category: newCat.id });
                              setCategoryError('');
                              setNewCategoryName('');
                              setShowNewCategory(false);
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                          className="px-4 py-2 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              className={`w-full border rounded-xl p-3 dark:bg-slate-700 dark:text-white transition-all ${categoryError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`}
                              placeholder="Kategoriya tanlang..."
                              value={categorySearch || categories.find(c => c.id === formData.category)?.name || ''}
                              onChange={e => {
                                setCategorySearch(e.target.value);
                                setShowCategoryDropdown(true);
                                if (!e.target.value) {
                                  setFormData({ ...formData, category: '' });
                                }
                                setCategoryError('');
                              }}
                              onFocus={() => setShowCategoryDropdown(true)}
                            />
                            {showCategoryDropdown && (
                              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {categories
                                  .filter(cat => cat.name.toLowerCase().includes((categorySearch || '').toLowerCase()))
                                  .map(cat => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 dark:text-white transition-colors ${formData.category === cat.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ''}`}
                                      onClick={() => {
                                        setFormData({ ...formData, category: cat.id });
                                        setCategorySearch('');
                                        setShowCategoryDropdown(false);
                                        setCategoryError('');
                                      }}
                                    >
                                      {cat.name}
                                    </button>
                                  ))}
                                {categories.filter(cat => cat.name.toLowerCase().includes((categorySearch || '').toLowerCase())).length === 0 && (
                                  <div className="px-4 py-3 text-slate-400 text-sm">Topilmadi</div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewCategory(true)}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-1 font-medium transition-colors"
                            title="Yangi kategoriya"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        {showCategoryDropdown && (
                          <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                        )}
                        {categoryError && <p className="text-red-500 text-xs mt-1">{categoryError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tannarx (so'm)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className={`w-full border rounded-xl p-3 dark:bg-slate-700 dark:text-white transition-all ${priceBuyError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`}
                        value={formatPrice(formData.priceBuy || '')}
                        onFocus={e => { if (e.target.value === '0') e.target.value = ''; }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9\s]/g, '');
                          setFormData({ ...formData, priceBuy: parsePrice(val) });
                          setPriceBuyError('');
                        }}
                        placeholder="0"
                      />
                      {priceBuyError && <p className="text-red-500 text-xs mt-1">{priceBuyError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sotuv narxi (so'm)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className={`w-full border rounded-xl p-3 dark:bg-slate-700 dark:text-white transition-all ${priceSellError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`}
                        value={formatPrice(formData.priceSell || '')}
                        onFocus={e => { if (e.target.value === '0') e.target.value = ''; }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9\s]/g, '');
                          setFormData({ ...formData, priceSell: parsePrice(val) });
                          setPriceSellError('');
                        }}
                        placeholder="0"
                      />
                      {priceSellError && <p className="text-red-500 text-xs mt-1">{priceSellError}</p>}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Boshlang'ich qoldiq</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white transition-all"
                        value={formData.stock || ''}
                        onFocus={e => { if (e.target.value === '0') e.target.value = ''; }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, stock: val === '' ? 0 : Number(val) });
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min. ogohlantirish</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white transition-all"
                        value={formData.minStock || ''}
                        onFocus={e => { if (e.target.value === '0') e.target.value = ''; }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, minStock: val === '' ? 0 : Number(val) });
                        }}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setNameError(''); }}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><Check className="w-4 h-4" />Saqlash</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">O'chirishni tasdiqlang</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Rostdan ham bu kitobni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</p>
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
        )
      }

      {/* New Category Modal */}
      {
        showNewCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Yangi kategoriya</h3>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Kategoriya nomi..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      onUpdateCategories([...categories, { id: generateId(), name: newCategoryName.trim() }]);
                      setNewCategoryName('');
                      setShowNewCategory(false);
                    }
                  }}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Yaratish
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Category Modal */}
      {
        editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Kategoriyani tahrirlash</h3>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Kategoriya nomi..."
                value={editCategoryName}
                onChange={e => setEditCategoryName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingCategory(null); setEditCategoryName(''); }}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveEditCategory}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Category Delete Confirmation Modal */}
      {
        categoryDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Kategoriyani o'chirish</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Rostdan ham ushbu kategoriyani o'chirmoqchimisiz?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCategoryDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleConfirmDeleteCategory}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    Ha, o'chirish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Inventory;