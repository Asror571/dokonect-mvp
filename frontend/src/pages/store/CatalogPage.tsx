import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProductsFn, fetchCategoriesFn } from '../../api/product.api';
import { useCartStore } from '../../store/cart.store';
import ProductCard from '../../components/products/ProductCard';
import { ShoppingBag, Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const LIMIT = 12;

const CatalogPage = () => {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['products', search, category, page],
    queryFn: () => fetchProductsFn({ search: search || undefined, category: category || undefined, page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const { data: catRes } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategoriesFn,
  });

  const { items, addItem } = useCartStore();
  const products: any[]    = fetchRes?.data?.products || [];
  const total: number      = fetchRes?.data?.total || 0;
  const totalPages         = Math.ceil(total / LIMIT);
  const categories: string[] = catRes?.data || [];

  const handleAddToCart = (product: any) => {
    addItem({ ...product, quantity: 1, productId: product.id });
    toast.success(`${product.name} savatga qo'shildi`, { icon: '🛍️' });
  };

  const hasFilters = search || category;

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Katalog</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {!isLoading && <span>{total} ta mahsulot</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Mahsulot qidirish..."
            className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm min-w-[160px]"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
            className="text-sm text-violet-600 font-medium hover:text-violet-700 whitespace-nowrap"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Mahsulotlar topilmadi</p>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setCategory(''); setPage(1); }} className="text-violet-600 text-sm font-medium hover:underline">
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product: any) => {
              const cartItem = items.find((i) => i.productId === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  type="STORE_OWNER"
                  onAddCart={handleAddToCart}
                  cartQuantity={cartItem?.quantity}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-slate-600 px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatalogPage;
