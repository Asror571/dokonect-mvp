import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchDistributorProductsFn, deleteProductFn } from '../../api/product.api';
import ProductCard from '../../components/products/ProductCard';
import { PackagePlus, Loader2, Package, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['distributor-products'],
    queryFn: fetchDistributorProductsFn,
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: deleteProductFn,
    onSuccess: () => {
      toast.success("Mahsulot o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['distributor-products'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error("O'chirishda xatolik");
      setDeleteId(null);
    },
  });

  const products = fetchRes?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
        <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mahsulotlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} ta mahsulot</p>
        </div>
        <Button onClick={() => navigate('/distributor/products/add')} size="sm">
          <PackagePlus className="w-4 h-4 mr-1.5" />
          Yangi mahsulot
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl border border-dashed border-slate-300 gap-3">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Mahsulotlar yo'q</p>
          <p className="text-slate-400 text-xs">Birinchi mahsulotingizni qo'shing</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/distributor/products/add')} className="mt-1">
            Mahsulot qo'shish
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              type="DISTRIBUTOR"
              onEdit={(p) => navigate(`/distributor/products/add?edit=${p.id}`, { state: p })}
              onDelete={(p) => setDeleteId(p.id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Mahsulotni o'chirish">
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-700 font-medium mb-1">Haqiqatan ham o'chirasizmi?</p>
          <p className="text-slate-400 text-sm mb-6">Bu amalni ortga qaytarib bo'lmaydi.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteId && deleteProduct(deleteId)} isLoading={isDeleting}>
              O'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
