import React, { useState } from 'react';
import { useCartStore } from '../../store/cart.store';
import { useMutation } from '@tanstack/react-query';
import { createOrderFn } from '../../api/order.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Plus, Minus, ShoppingCart, MapPin, ArrowRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCartStore();
  const [address, setAddress] = useState('');
  const [note, setNote]       = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: createOrderFn,
    onSuccess: () => {
      toast.success('Buyurtma qabul qilindi!');
      clearCart();
      navigate('/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const handleCheckout = () => {
    if (!items.length) return toast.error("Savat bo'sh");
    if (!address.trim()) return toast.error('Manzilni kiriting');

    const distributorIds = [...new Set(items.map(i => i.distributorId))];
    if (distributorIds.length > 1) {
      return toast.error("Faqat bitta distribyutordan buyurtma bering");
    }

    mutate({
      distributorId: items[0].distributorId,
      address,
      note,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  if (!items.length) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Savat bo'sh</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">Katalogdan mahsulot tanlang va savatga qo'shing</p>
        <Button onClick={() => navigate('/catalog')}>Katalogga o'tish</Button>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Savat</h1>
        <p className="text-slate-500 text-sm mt-0.5">{items.length} ta mahsulot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h3>
                <p className="text-violet-600 font-semibold text-sm mt-0.5">
                  {item.price.toLocaleString('uz-UZ')} UZS
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.stock} ta mavjud</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-800">
                  {(item.price * item.quantity).toLocaleString('uz-UZ')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-slate-800 mb-4">Buyurtma</h3>

            <div className="space-y-3 mb-4">
              <Input
                label="Yetkazib berish manzili"
                placeholder="Aniq manzilni kiriting"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Izoh (ixtiyoriy)
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all h-20 resize-none shadow-sm"
                  placeholder="Qo'shimcha eslatma..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Jami:</span>
                <span className="text-lg font-bold text-violet-600">
                  {totalAmount().toLocaleString('uz-UZ')} UZS
                </span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCheckout} isLoading={isPending}>
              {!isPending && <>Buyurtma berish <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>

            <p className="text-center text-[11px] text-slate-400 mt-3">
              Dokonect xavfsiz to'lov kafolati
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
