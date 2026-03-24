import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProductFn, updateProductFn } from '../../api/product.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ImagePlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name:        z.string().min(3, 'Mahsulot nomi kiritilishi shart'),
  price:       z.string().min(1, 'Narx kiritilishi shart'),
  stock:       z.string().min(1, 'Miqdor kiritilishi shart'),
  description: z.string().optional(),
  category:    z.string().min(2, 'Turkum kiritilishi shart'),
  unit:        z.string().min(1, 'Birlik kiritilishi shart'),
});
type ProductForm = z.infer<typeof productSchema>;

const AddProductPage = () => {
  const navigate      = useNavigate();
  const location      = useLocation();
  const queryClient   = useQueryClient();
  const editProduct   = location.state;
  const isEditing     = !!editProduct;

  const [imagePreview, setImagePreview] = useState<string | null>(editProduct?.imageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (isEditing) {
      reset({
        name:        editProduct.name,
        price:       editProduct.price.toString(),
        stock:       editProduct.stock.toString(),
        description: editProduct.description || '',
        category:    editProduct.category,
        unit:        editProduct.unit,
      });
      setImagePreview(editProduct.imageUrl);
    }
  }, [isEditing, editProduct, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm 5MB dan oshmasin'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onMutationSuccess = (msg: string) => {
    toast.success(msg);
    queryClient.invalidateQueries({ queryKey: ['distributor-products'] });
    navigate('/distributor/products');
  };

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: createProductFn,
    onSuccess: () => onMutationSuccess('Mahsulot qo\'shildi'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: updateProductFn,
    onSuccess: () => onMutationSuccess('Mahsulot yangilandi'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const onSubmit = (data: ProductForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });
    if (selectedFile) formData.append('image', selectedFile);

    if (isEditing) updateProduct({ id: editProduct.id, formData });
    else createProduct(formData);
  };

  const isPending = isCreating || isUpdating;

  return (
    <div className="fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/distributor/products')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Ma'lumotlarni to'ldiring</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Rasm
            </label>
            <input type="file" id="img" className="hidden" accept="image/*" onChange={handleImageChange} />
            <label
              htmlFor="img"
              className="group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden bg-slate-50 hover:border-violet-400 hover:bg-violet-50/30"
              style={{ borderColor: imagePreview ? '#8b5cf6' : undefined }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-3" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                      Rasmni almashtirish
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImagePlus className="w-8 h-8" />
                  <p className="text-sm font-medium">Rasm tanlang</p>
                  <p className="text-xs">PNG, JPG, WEBP — max 5MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Mahsulot nomi" placeholder="Masalan: Qalampir chipslari" error={errors.name?.message} {...register('name')} />
            </div>
            <Input label="Narxi (UZS)" type="number" placeholder="10000" error={errors.price?.message} {...register('price')} />
            <Input label="Miqdor (stok)" type="number" placeholder="500" error={errors.stock?.message} {...register('stock')} />
            <Input label="Kategoriya" placeholder="Oziq-ovqat" error={errors.category?.message} {...register('category')} />
            <Input label="Birlik" placeholder="dona, kg, litr" error={errors.unit?.message} {...register('unit')} />
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tavsif (ixtiyoriy)
              </label>
              <textarea
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all h-24 resize-none shadow-sm"
                placeholder="Mahsulot haqida qisqacha..."
                {...register('description')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/distributor/products')} className="flex-1">
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={isPending} className="flex-[2]" size="lg">
              {!isPending && (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {isEditing ? 'Saqlash' : "Qo'shish"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
