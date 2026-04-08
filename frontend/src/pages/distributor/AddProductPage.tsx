import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ImagePlus, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(3, 'Mahsulot nomi kiritilishi shart'),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  wholesalePrice: z.string().min(1, 'Ulgurji narx kiritilishi shart'),
  retailPrice: z.string().optional(),
  discountType: z.enum(['', 'PERCENT', 'FIXED']).optional(),
  discountValue: z.string().optional(),
  description: z.string().optional(),
  youtubeUrl: z.string().optional(),
  unit: z.string().min(1, 'Birlik kiritilishi shart'),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']),
});

type ProductForm = z.infer<typeof productSchema>;

const AddProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const editProduct = location.state;
  const isEditing = !!editProduct;

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(editProduct?.images || []);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/distributor/categories').then(res => res.data?.data || [])
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/distributor/brands').then(res => res.data?.data || [])
  });

  useEffect(() => {
    if (isEditing) {
      reset({
        name: editProduct.name,
        sku: editProduct.sku,
        categoryId: editProduct.categoryId || '',
        brandId: editProduct.brandId || '',
        wholesalePrice: editProduct.wholesalePrice?.toString() || '',
        retailPrice: editProduct.retailPrice?.toString() || '',
        discountType: editProduct.discountType || '',
        discountValue: editProduct.discountValue?.toString() || '',
        description: editProduct.description || '',
        youtubeUrl: editProduct.youtubeUrl || '',
        unit: editProduct.unit || 'pcs',
        status: editProduct.status || 'DRAFT',
      });
    }
  }, [isEditing, editProduct, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error('Ba\'zi rasmlar 5MB dan katta bo\'lgani uchun olib tashlandi');
    }

    if (images.length + validFiles.length + existingImages.length > 10) {
      toast.error('Maksimal 10 ta rasm yuklash mumkin');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages(existingImages.filter((_: any, i: number) => i !== index));
    } else {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (productId: string) => {
    if (images.length === 0 && existingImages.length === 0) return;

    let newImageUrls: any[] = [];
    if (images.length > 0) {
      const formData = new FormData();
      images.forEach(img => formData.append('images', img));
      const res = await api.post('/distributor/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      newImageUrls = res.data?.data || [];
    }

    const allImages = [
      ...existingImages.map((img: any, i: number) => ({ url: img.url, order: i, isCover: i === 0 })),
      ...newImageUrls.map((url: string, i: number) => ({ url, order: existingImages.length + i, isCover: existingImages.length === 0 && i === 0 }))
    ];

    if (allImages.length > 0) {
      await api.post(`/distributor/products/${productId}/images`, { images: allImages });
    }
  };

  const onMutationSuccess = (msg: string) => {
    toast.success(msg);
    queryClient.invalidateQueries({ queryKey: ['distributor-products'] });
    navigate('/distributor/products');
  };

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/distributor/products', data);
      await uploadImages(res.data.data.id);
      return res.data;
    },
    onSuccess: () => onMutationSuccess("Mahsulot qo'shildi"),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await api.put(`/distributor/products/${id}`, data);
      await uploadImages(id);
      return res.data;
    },
    onSuccess: () => onMutationSuccess('Mahsulot yangilandi'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const onSubmit = (data: ProductForm) => {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      brandId: data.brandId || undefined,
      wholesalePrice: Number(data.wholesalePrice),
      retailPrice: data.retailPrice ? Number(data.retailPrice) : undefined,
      discountValue: data.discountValue ? Number(data.discountValue) : undefined,
      discountType: data.discountType || undefined,
    };

    if (isEditing) updateProduct({ id: editProduct.id, data: payload });
    else createProduct(payload);
  };

  const isPending = isCreating || isUpdating;

  return (
    <div className="fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/distributor/products')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Yangi mahsulot parametrlarini sozlang</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Asosiy ma'lumotlar</h3>
            </div>
            
            <Input label="Mahsulot nomi *" placeholder="Masalan: Galaxy S24" error={errors.name?.message} {...register('name')} />
            <Input label="SKU / ID" placeholder="Avtomatik yaratish uchun bo'sh qoldiring" error={errors.sku?.message} {...register('sku')} />

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Kategoriya</label>
              <select {...register('categoryId')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all">
                <option value="">Tanlang</option>
                {categories?.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Brand</label>
              <select {...register('brandId')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all">
                <option value="">Tanlang</option>
                {brands?.map((b: any) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Narx va Chegirma</h3>
            </div>

            <Input label="Ulgurji narx (Distributor narxi) *" type="number" placeholder="15000" error={errors.wholesalePrice?.message} {...register('wholesalePrice')} />
            <Input label="Chakana narx (Tavsiya narx)" type="number" placeholder="20000" error={errors.retailPrice?.message} {...register('retailPrice')} />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Chegirma turi</label>
              <select {...register('discountType')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all">
                <option value="">Yo'q</option>
                <option value="PERCENT">Foiz (%)</option>
                <option value="FIXED">Summa (UZS)</option>
              </select>
            </div>
            <Input label="Chegirma qiymati" type="number" placeholder="10" error={errors.discountValue?.message} {...register('discountValue')} />

            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Qo'shimcha sozlamalar</h3>
            </div>

            <Input label="O'lchov birligi" placeholder="dona, kg, korobka" error={errors.unit?.message} {...register('unit')} />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Holati</label>
              <select {...register('status')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all">
                <option value="ACTIVE">Faol (Active)</option>
                <option value="DRAFT">Qoralama (Draft)</option>
                <option value="OUT_OF_STOCK">Tugagan (Out of stock)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input label="YouTube havolasi" placeholder="YouTube video URL" error={errors.youtubeUrl?.message} {...register('youtubeUrl')} />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Tavsif</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all h-32 resize-y"
                placeholder="Mahsulot haqida ma'lumot..."
                {...register('description')}
              />
            </div>
            
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Rasmlar (Max 10)</h3>
              
              <div className="flex flex-wrap gap-4 mt-4">
                {existingImages.map((img: any, i: number) => (
                  <div key={`exist-${i}`} className="relative w-28 h-28 border border-slate-200 rounded-xl overflow-hidden group">
                    <img src={img.url} alt="product" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i, true)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-sky-500 text-white text-[10px] text-center py-0.5">Asosiy</div>}
                  </div>
                ))}
                
                {images.map((img, i) => (
                  <div key={`new-${i}`} className="relative w-28 h-28 border border-slate-200 rounded-xl overflow-hidden group">
                    <img src={URL.createObjectURL(img)} alt="product" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i, false)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    {existingImages.length === 0 && i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-sky-500 text-white text-[10px] text-center py-0.5">Asosiy</div>}
                  </div>
                ))}

                {existingImages.length + images.length < 10 && (
                  <>
                    <input type="file" id="images-up" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                    <label htmlFor="images-up" className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-all text-slate-400 hover:text-sky-500">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-semibold">Qo'shish</span>
                    </label>
                  </>
                )}
              </div>
            </div>

          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => navigate('/distributor/products')} className="px-8">Bekor qilish</Button>
            <Button type="submit" isLoading={isPending} className="px-8 bg-sky-500 hover:bg-sky-600">
              {!isPending && <><CheckCircle2 className="w-4 h-4 mr-2" />{isEditing ? 'Saqlash' : "Qo'shish"}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
