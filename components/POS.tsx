import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, CartItem, Partner, TransactionType, PaymentMethod, Transaction } from '../types';
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Trash, Image as ImageIcon, ScanBarcode, AlertCircle } from 'lucide-react';
import { generateId } from '../services/storage';

interface POSProps {
  products: Product[];
  customers: Partner[];
  onTransaction: (transaction: Transaction, updatedProducts: Product[], updatedCustomer?: Partner) => void;
}

const POS: React.FC<POSProps> = ({ products, customers, onTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial state from localStorage if available
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ziyobook_pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return localStorage.getItem('ziyobook_pos_customer') || '';
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const saved = localStorage.getItem('ziyobook_pos_payment');
    return (saved as PaymentMethod) || PaymentMethod.CASH;
  });

  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ziyobook_pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ziyobook_pos_customer', selectedCustomerId);
  }, [selectedCustomerId]);

  useEffect(() => {
    localStorage.setItem('ziyobook_pos_payment', paymentMethod);
  }, [paymentMethod]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Removed stock limit check to allow negative sales
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
    return products.filter(p => 
      // Removed "p.stock > 0" filter to show all products
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (p.barcode && p.barcode.includes(searchTerm)))
    );
  }, [products, searchTerm]);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + change;
          // Removed maxStock check to allow overselling
          if (newQty > 0) return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.priceSell * item.qty), 0);

  const handleCheckout = () => {
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
    
    // Clear State and LocalStorage
    setCart([]);
    setSelectedCustomerId('');
    setPaymentMethod(PaymentMethod.CASH);
    localStorage.removeItem('ziyobook_pos_cart');
    localStorage.removeItem('ziyobook_pos_customer');
    localStorage.removeItem('ziyobook_pos_payment');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Shtrix-kodni skaner qiling yoki nomini yozing..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`flex flex-col items-start p-3 border rounded-lg hover:shadow-md transition-all text-left h-full ${
                    product.stock <= 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-500'
                }`}
              >
                <div className="w-full aspect-[2/3] bg-white rounded mb-2 flex items-center justify-center overflow-hidden border border-slate-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center">
                         <ImageIcon className="w-8 h-8 mb-1 opacity-50"/>
                         <span>Rasm yo'q</span>
                      </div>
                    )}
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight mb-1">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-1">{product.category}</p>
                <div className="mt-auto pt-2 w-full">
                  <p className="font-bold text-emerald-600">{product.priceSell.toLocaleString()} so'm</p>
                  <div className={`text-xs mt-0.5 flex items-center ${product.stock <= 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {product.stock <= 0 && <AlertCircle className="w-3 h-3 mr-1" />}
                    Qoldiq: {product.stock}
                  </div>
                </div>
              </button>
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
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h2 className="font-bold text-lg flex items-center text-slate-800">
            <ShoppingCart className="w-5 h-5 mr-2" /> Savat
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">Savat bo'sh</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-emerald-600 font-semibold">{item.priceSell.toLocaleString()} x {item.qty}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"><Trash className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-4 bg-slate-50">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mijoz (Ixtiyoriy)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select 
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To'lov turi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: PaymentMethod.CASH, label: 'Naqd' },
                { id: PaymentMethod.CARD, label: 'Karta' },
                { id: PaymentMethod.DEBT, label: 'Nasiya' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`py-2 text-sm rounded-lg border ${
                    paymentMethod === method.id 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500'
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
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl print:shadow-none print:w-full print:max-w-none">
            <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
              <h1 className="text-xl font-bold uppercase tracking-wider">ZiyoBook</h1>
              <p className="text-slate-500 text-sm">Kitob do'koni</p>
              <p className="text-slate-400 text-xs mt-1">{new Date(showReceipt.date).toLocaleString()}</p>
              <p className="text-slate-400 text-xs">Chek #{showReceipt.id.slice(-6)}</p>
            </div>

            <div className="space-y-3 mb-6">
              {showReceipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-800">{item.name} <span className="text-xs text-slate-500">x{item.qty}</span></span>
                  <span className="font-medium">{(item.priceSell * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Jami:</span>
                <span>{showReceipt.totalAmount.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>To'lov turi:</span>
                <span>
                  {showReceipt.paymentMethod === PaymentMethod.CASH ? 'Naqd' : 
                   showReceipt.paymentMethod === PaymentMethod.CARD ? 'Karta' : 'Nasiya'}
                </span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 mb-6">
              Xaridingiz uchun rahmat!<br/>
              Har doim biz bilan bo'ling.
            </div>

            <div className="flex flex-col gap-2 no-print">
              <button onClick={handlePrint} className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium">Chop etish</button>
              <button onClick={() => setShowReceipt(null)} className="w-full text-slate-500 py-2">Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;