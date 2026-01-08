import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, Partner, TransactionType, PaymentMethod, Transaction } from '../types';
import { Search, Plus, Minus, PackagePlus, User, Trash, Image as ImageIcon, ScanBarcode, Upload, X } from 'lucide-react';
import { generateId, convertFileToBase64, getSupplySessionData, saveSupplySessionData, clearSupplySessionData, SupplyCartItem } from '../services/storage';

interface SupplyProps {
  products: Product[];
  suppliers: Partner[];
  onTransaction: (transaction: Transaction, updatedProducts: Product[], updatedSupplier?: Partner) => void;
  onUpdateProducts: (products: Product[]) => void;
}

const Supply: React.FC<SupplyProps> = ({ products, suppliers, onTransaction, onUpdateProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session state
  const [cart, setCart] = useState<SupplyCartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Modal State for New Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', category: '', priceBuy: 0, priceSell: 0, stock: 0, minStock: 5, imageUrl: '', barcode: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial state from Firebase
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getSupplySessionData();
        setCart(session.cart);
        setSelectedSupplierId(session.supplierId);
        setPaymentMethod(session.paymentMethod);
      } catch (error) {
        console.error('Error loading Supply session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // Save session to Firebase with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveSessionDebounced = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSupplySessionData({
        cart,
        supplierId: selectedSupplierId,
        paymentMethod
      });
    }, 500);
  }, [cart, selectedSupplierId, paymentMethod]);

  useEffect(() => {
    if (!isLoading) {
      saveSessionDebounced();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cart, selectedSupplierId, paymentMethod, isLoading, saveSessionDebounced]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, newCost: product.priceBuy }];
    });
  };

  // BARCODE SCANNER LOGIC for Supply
  useEffect(() => {
    if (!searchTerm) return;

    const matchedProduct = products.find(p => p.barcode === searchTerm);

    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchTerm(''); // Clear input
    }
  }, [searchTerm, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);


  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + change);
          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const updateCost = (id: string, newCost: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, newCost } : item));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.newCost * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Create transaction
    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.PURCHASE,
      totalAmount,
      paymentMethod,
      partnerId: selectedSupplierId || undefined,
      items: cart.map(c => ({ ...c, priceBuy: c.newCost })), // Store the cost at moment of purchase
      note: `Kirim: ${cart.length} xil mahsulot`
    };

    // Update products (increase stock and update cost price to latest)
    const updatedProducts = products.map(p => {
      const inCart = cart.find(c => c.id === p.id);
      if (inCart) {
        return {
          ...p,
          stock: p.stock + inCart.qty,
          priceBuy: inCart.newCost // Update cost price to the new one
        };
      }
      return p;
    });

    // Update supplier balance if Debt
    let updatedSupplier: Partner | undefined;
    if (selectedSupplierId && paymentMethod === PaymentMethod.DEBT) {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (supplier) {
        // We owe them money, so balance decreases (becomes more negative)
        // Check definition in types.ts: "Negative = we owe them"
        updatedSupplier = { ...supplier, balance: supplier.balance - totalAmount };
      }
    }

    onTransaction(transaction, updatedProducts, updatedSupplier);

    // Clear state and Firebase session
    setCart([]);
    setSelectedSupplierId('');
    setPaymentMethod(PaymentMethod.CASH);
    await clearSupplySessionData();

    alert("Mahsulotlar muvaffaqiyatli kirim qilindi!");
  };

  // Create New Product Logic
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.priceSell) return;

    const product: Product = {
      id: generateId(),
      name: newProduct.name,
      category: newProduct.category || 'Boshqa',
      priceBuy: Number(newProduct.priceBuy),
      priceSell: Number(newProduct.priceSell),
      stock: 0, // Initial stock 0, will be added via Supply cart
      minStock: Number(newProduct.minStock) || 5,
      imageUrl: newProduct.imageUrl,
      barcode: newProduct.barcode
    };

    // 1. Update Global Products
    onUpdateProducts([...products, product]);

    // 2. Automatically Add to Supply Cart for immediate stocking
    addToCart(product);

    // 3. Reset and Close
    setIsModalOpen(false);
    setNewProduct({ name: '', category: '', priceBuy: 0, priceSell: 0, stock: 0, minStock: 5, imageUrl: '', barcode: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setNewProduct({ ...newProduct, imageUrl: base64 });
      } catch (error) {
        alert("Rasm yuklashda xatolik bo'ldi");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-slate-500">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Skaner yoki nomini yozing..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-1" /> Yangi
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-start p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-slate-50 text-left h-full"
              >
                <div className="w-full aspect-[2/3] bg-slate-200 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span>Rasm yo'q</span>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 bg-white px-1.5 rounded text-xs font-bold text-slate-600 shadow-sm">
                    {product.stock} dona
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight mb-1">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-1">{product.category}</p>
                <div className="mt-auto pt-2 w-full">
                  <p className="font-bold text-blue-600">{product.priceBuy.toLocaleString()} so'm</p>
                  <p className="text-xs text-slate-400 mt-0.5">Joriy Tannarx</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full lg:w-[450px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-blue-50 rounded-t-xl">
          <h2 className="font-bold text-lg flex items-center text-blue-800">
            <PackagePlus className="w-5 h-5 mr-2" /> Qabul Qilish (Kirim)
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">Kirim qilish uchun mahsulot tanlang</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-slate-800 line-clamp-1 flex-1">{item.name}</h4>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Kelish narxi</label>
                    <input
                      type="number"
                      className="w-full border rounded p-1 text-sm"
                      value={item.newCost}
                      onChange={(e) => updateCost(item.id, Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Soni</label>
                    <div className="flex items-center">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Minus className="w-3 h-3" /></button>
                      <input
                        type="number"
                        className="w-full text-center border-none focus:ring-0 p-0 text-sm font-bold"
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCart(prev => prev.map(p => p.id === item.id ? { ...p, qty: val } : p));
                        }}
                      />
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-slate-700 border-t pt-1 border-dashed">
                  Jami: {(item.newCost * item.qty).toLocaleString()} so'm
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-4 bg-slate-50">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ta'minotchi (Ixtiyoriy)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                <option value="">Tanlanmagan</option>
                {suppliers.filter(s => s.type === 'SUPPLIER').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To'lov turi</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: PaymentMethod.CASH, label: 'Naqd (Kassadan)' },
                { id: PaymentMethod.DEBT, label: 'Nasiya (Qarzga)' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`py-2 text-sm rounded-lg border ${paymentMethod === method.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-500'
                    }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end pt-2">
            <span className="text-slate-500 text-sm">Jami summa:</span>
            <span className="text-2xl font-bold text-slate-800">{totalAmount.toLocaleString()} so'm</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          >
            <PackagePlus className="w-5 h-5 mr-2" />
            Kirim Qilish
          </button>
        </div>
      </div>

      {/* NEW PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Yangi Mahsulot Yaratish</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shtrix-kod (Skaner)</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 pl-9"
                    value={newProduct.barcode || ''}
                    onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
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
                    {newProduct.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, imageUrl: '' })}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Rasmni o'chirish"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-20 h-28 bg-slate-100 rounded border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {newProduct.imageUrl ? (
                    <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomi</label>
                <input type="text" required className="w-full border rounded-lg p-2" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
                <input type="text" required className="w-full border rounded-lg p-2" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kelish Narxi (Tannarx)</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={newProduct.priceBuy} onChange={e => setNewProduct({ ...newProduct, priceBuy: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sotuv Narxi</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={newProduct.priceSell} onChange={e => setNewProduct({ ...newProduct, priceSell: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Qoldiq</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={newProduct.minStock} onChange={e => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Yaratish va Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Supply;