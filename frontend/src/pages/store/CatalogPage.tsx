import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStoreCatalogFn, fetchCategoriesFn } from '../../api/product.api';
import { useCartStore } from '../../store/cart.store';
import ProductCard from '../../components/products/ProductCard';
import { ShoppingBag, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const LIMIT = 12;

const CatalogPage = () => {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy]     = useState('newest');
  const [page, setPage]         = useState(1);

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['store-catalog', search, category, sortBy, page],
    queryFn: () => fetchStoreCatalogFn({
      search: search || undefined,
      category: category || undefined,
      sortBy: sortBy === 'price_asc' ? 'price_asc' : 
              sortBy === 'price_desc' ? 'price_desc' : 
              sortBy === 'newest' ? undefined : undefined,
      page,
      limit: LIMIT,
    }),
  });

  const { data: catRes } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategoriesFn,
  });

  const { items, addItem } = useCartStore();
  const catalogData: any = fetchRes || {};
  const products: any[] = catalogData.products || [];
  const total: number = catalogData.total || 0; 
  const totalPages = Math.ceil(total / LIMIT);
  const categories: string[] = catRes || [];

  const handleAddToCart = (product: any) => {
    addItem({ ...product, quantity: 1, productId: product.id });
    toast.success(`${product.name} savatga qo'shildi`, { icon: '🛍️' });
  };

  const hasFilters = search || category || sortBy !== 'newest';

  return (
    <div className="page fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mahsulotlar Katalogi</h1>
        <p className="text-slate-500 font-medium mt-1">
          Hamkorlarimiz mahsulotlarini ko'ring va savatga qo'shing.
        </p>
      </div>

      {/* Filters Container */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Mahsulot yoki SKU qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
             <div className="relative min-w-[200px]">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="w-full pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Barcha Kategoriyalar</option>
                    {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
             </div>

             <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="pl-4 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500/20"
             >
                <option value="newest">Yangi</option>
                <option value="price_asc">Arzonroq</option>
                <option value="price_desc">Qimmatroq</option>
             </select>
          </div>
        </div>

        {hasFilters && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrlar faol</p>
                <button
                    onClick={() => { setSearch(''); setCategory(''); setSortBy('newest'); setPage(1); }}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                >
                    Tozalash
                </button>
            </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <div key={n} className="h-72 bg-slate-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold">Mahsulotlar topilmadi</p>
          <p className="text-slate-400 text-sm mt-1">Boshqa so'z bilan qidirib ko'ring yoki filtrlarni tozalang.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product: any) => {
              const cartItem = items.find((i) => i.productId === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={{ ...product, price: product.wholesalePrice }}
                  type="STORE_OWNER"
                  onAddCart={handleAddToCart}
                  cartQuantity={cartItem?.quantity}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="w-12 h-12 p-0 rounded-2xl border-slate-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-black text-slate-900 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">{page}</span>
                 <span className="text-xs font-bold text-slate-400">/ {totalPages}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="w-12 h-12 p-0 rounded-2xl border-slate-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatalogPage;
