import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, Partner, TransactionType, PaymentMethod, Transaction, Category } from '../types';
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Trash, Image as ImageIcon, ScanBarcode, AlertCircle, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateId, getPOSSessionData, savePOSSessionData, clearPOSSessionData } from '../services/storage';

interface POSProps {
  products: Product[];
  customers: Partner[];
  onTransaction: (transaction: Transaction, updatedProducts: Product[], updatedCustomer?: Partner) => void;
  onUpdateProducts: (products: Product[]) => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  allowNegativeStock: boolean;
}

import { useAuth } from '../contexts/AuthContext';

const POS: React.FC<POSProps> = ({ products, customers, onTransaction, onUpdateProducts, categories, onUpdateCategories, allowNegativeStock }) => {
  const { storeId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Load initial state from Firebase
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getPOSSessionData(storeId || undefined);
        setCart(session.cart);
        setSelectedCustomerId(session.customerId);
        setPaymentMethod(session.paymentMethod);
      } catch (error) {
        console.error('Error loading POS session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, [storeId]);

  // Save session to Firebase with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveSessionDebounced = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      savePOSSessionData({
        cart,
        customerId: selectedCustomerId,
        paymentMethod
      }, storeId || undefined);
    }, 500);
  }, [cart, selectedCustomerId, paymentMethod, storeId]);

  useEffect(() => {
    if (!isLoading) {
      saveSessionDebounced();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cart, selectedCustomerId, paymentMethod, isLoading, saveSessionDebounced]);

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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQtyInCart = existing ? existing.qty : 0;

      // Check stock limit if negative stock is disabled
      if (!allowNegativeStock && (currentQtyInCart + 1) > product.stock) {
        alert(`"${product.name}" omborda yetarli emas. Qoldiq: ${product.stock}`);
        return prev;
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // BARCODE SCANNER LOGIC
  useEffect(() => {
    if (!searchTerm) return;

    const matchedProduct = products.find(p => p.barcode === searchTerm);

    // Allow adding even if stock is 0
    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchTerm('');
    }
  }, [searchTerm, products]);


  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + change;
          const product = products.find(p => p.id === id);

          // Check stock limit if negative stock is disabled and increasing quantity
          if (!allowNegativeStock && change > 0 && product && newQty > product.stock) {
            alert(`"${product.name}" omborda yetarli emas. Qoldiq: ${product.stock}`);
            return item;
          }

          if (newQty > 0) return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.priceSell * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.DEBT && !selectedCustomerId) {
      alert("Nasiya savdo uchun mijoz tanlanishi shart!");
      return;
    }

    const transaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type: TransactionType.SALE,
      totalAmount,
      paymentMethod,
      partnerId: selectedCustomerId || undefined,
      items: [...cart],
      profit: cart.reduce((sum, item) => sum + ((item.priceSell - item.priceBuy) * item.qty), 0)
    };

    // Calculate updated stock
    const updatedProducts = products.map(p => {
      const inCart = cart.find(c => c.id === p.id);
      if (inCart) {
        return { ...p, stock: p.stock - inCart.qty };
      }
      return p;
    });

    // Update customer balance if debt
    let updatedCustomer: Partner | undefined;
    if (selectedCustomerId && paymentMethod === PaymentMethod.DEBT) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        updatedCustomer = { ...customer, balance: customer.balance + totalAmount };
      }
    }

    onTransaction(transaction, updatedProducts, updatedCustomer);
    setShowReceipt(transaction);

    // Clear State and Firebase session
    setCart([]);
    setSelectedCustomerId('');
    setPaymentMethod(PaymentMethod.CASH);
    await clearPOSSessionData(storeId || undefined);
  };

  const handlePrint = () => {
    window.print();
  };

  // Edit product handlers
  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setEditFormData(product);
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editFormData.name || !editFormData.priceSell) return;
    const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...editFormData } as Product : p);
    onUpdateProducts(updated);
    setEditingProduct(null);
    setEditFormData({});
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
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20">
          <div className="relative flex items-center">
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 p-2 bg-gradient-to-r from-slate-50 dark:from-slate-800 via-slate-50 dark:via-slate-800 to-transparent hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 h-full flex items-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              ref={scrollRef}
              className="flex-1 w-0 flex items-center gap-2 overflow-x-auto px-8 py-2 scroll-smooth no-scrollbar"
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
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
              >
                Hammasi
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 p-2 bg-gradient-to-l from-slate-50 dark:from-slate-800 via-slate-50 dark:via-slate-800 to-transparent hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 h-full flex items-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Shtrix-kodni skaner qiling yoki nomini yozing..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="relative">
                <button
                  onClick={() => addToCart(product)}
                  className={`flex flex-col items-start p-3 border rounded-lg hover:shadow-md transition-all text-left h-full w-full ${product.stock <= 0
                    ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500'
                    }`}
                >
                  <div className="w-full aspect-[2/3] bg-white rounded mb-2 flex items-center justify-center overflow-hidden border border-slate-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                        <span>Rasm yo'q</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-2 text-sm leading-tight mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{categories.find(c => c.id === product.category)?.name || product.category}</p>
                  <div className="mt-auto pt-2 w-full">
                    <p className="font-bold text-emerald-600">{product.priceSell.toLocaleString()} so'm</p>
                    <div className={`text-xs mt-0.5 flex items-center ${product.stock <= 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {product.stock <= 0 && <AlertCircle className="w-3 h-3 mr-1" />}
                      Qoldiq: {product.stock}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleEditProduct(e, product)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg shadow-sm border border-slate-200"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-10">
                Mahsulot topilmadi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
          <h2 className="font-bold text-lg flex items-center text-slate-800 dark:text-white">
            <ShoppingCart className="w-5 h-5 mr-2" /> Savat
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">Savat bo'sh</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-2 rounded-lg shadow-sm">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{item.priceSell.toLocaleString()} x {item.qty}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-100 dark:bg-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm w-4 text-center text-slate-800 dark:text-white">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-100 dark:bg-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-1"><Trash className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Mijoz (Ixtiyoriy)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Tanlanmagan</option>
                {customers.filter(c => c.type === 'CUSTOMER').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">To'lov turi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: PaymentMethod.CASH, label: 'Naqd' },
                { id: PaymentMethod.CARD, label: 'Karta' },
                { id: PaymentMethod.DEBT, label: 'Nasiya' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`py-2 text-sm rounded-lg border transition-colors ${paymentMethod === method.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end pt-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm">Jami summa:</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalAmount.toLocaleString()} so'm</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            To'lash
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-sm w-full shadow-2xl print:shadow-none print:w-full print:max-w-none print:text-black">
            <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-4">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800 dark:text-white print:text-black">ZiyoBook</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm print:text-gray-600">Kitob do'koni</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 print:text-gray-500">{new Date(showReceipt.date).toLocaleString()}</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs print:text-gray-500">Chek #{showReceipt.id.slice(-6)}</p>
            </div>

            <div className="space-y-3 mb-6">
              {showReceipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-800 dark:text-white print:text-black">{item.name} <span className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">x{item.qty}</span></span>
                  <span className="font-medium text-slate-800 dark:text-white print:text-black">{(item.priceSell * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-white">
                <span>Jami:</span>
                <span>{showReceipt.totalAmount.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span>To'lov turi:</span>
                <span>
                  {showReceipt.paymentMethod === PaymentMethod.CASH ? 'Naqd' :
                    showReceipt.paymentMethod === PaymentMethod.CARD ? 'Karta' : 'Nasiya'}
                </span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 dark:text-slate-500 mb-6">
              Xaridingiz uchun rahmat!<br />
              Har doim biz bilan bo'ling.
            </div>

            <div className="flex flex-col gap-2 no-print">
              <button onClick={handlePrint} className="w-full bg-slate-800 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors">Chop etish</button>
              <button onClick={() => setShowReceipt(null)} className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-2 transition-colors">Yopish</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Mahsulotni tahrirlash</h2>
              <button onClick={() => { setEditingProduct(null); setEditFormData({}); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomi</label>
                <input type="text" required className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editFormData.name || ''} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoriya</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Kategoriya qidirish..."
                    value={categorySearch || categories.find(c => c.id === editFormData.category)?.name || ''}
                    onChange={e => { setCategorySearch(e.target.value); setShowCategoryDropdown(true); }}
                    onFocus={() => setShowCategoryDropdown(true)}
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {categories.filter(cat => cat.name.toLowerCase().includes((categorySearch || '').toLowerCase())).map(cat => (
                        <button key={cat.id} type="button" className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 dark:text-white ${editFormData.category === cat.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ''}`}
                          onClick={() => { setEditFormData({ ...editFormData, category: cat.id }); setCategorySearch(''); setShowCategoryDropdown(false); }}>
                          {cat.name}
                        </button>
                      ))}
                      <button type="button" className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t dark:border-slate-600"
                        onClick={() => { const name = prompt('Yangi kategoriya nomi:'); if (name?.trim()) { const newCat = { id: generateId(), name: name.trim() }; onUpdateCategories([...categories, newCat]); setEditFormData({ ...editFormData, category: newCat.id }); setShowCategoryDropdown(false); } }}>
                        + Yangi kategoriya
                      </button>
                    </div>
                  )}
                  {showCategoryDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tannarx</label>
                  <input type="number" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editFormData.priceBuy || 0} onChange={e => setEditFormData({ ...editFormData, priceBuy: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sotuv narxi</label>
                  <input type="number" required className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editFormData.priceSell || 0} onChange={e => setEditFormData({ ...editFormData, priceSell: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qoldiq</label>
                  <input type="number" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editFormData.stock || 0} onChange={e => setEditFormData({ ...editFormData, stock: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min. chegara</label>
                  <input type="number" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editFormData.minStock || 0} onChange={e => setEditFormData({ ...editFormData, minStock: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => { setEditingProduct(null); setEditFormData({}); }} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;