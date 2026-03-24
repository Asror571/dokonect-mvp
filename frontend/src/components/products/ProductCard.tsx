import React from 'react';
import { ShoppingCart, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../ui/Button';
import StarRating from '../reviews/StarRating';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  category: string;
  unit: string;
  avgRating?: number;
  reviewCount?: number;
  distributor?: { companyName: string };
  distributorId?: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  type?: 'STORE_OWNER' | 'DISTRIBUTOR';
  onAddCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  cartQuantity?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product, type = 'STORE_OWNER', onAddCart, onEdit, onDelete, cartQuantity = 0,
}) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <Package className="w-10 h-10" />
            <span className="text-xs font-medium">Rasm yo'q</span>
          </div>
        )}

        {/* Cart badge */}
        {cartQuantity > 0 && type === 'STORE_OWNER' && (
          <div className="absolute top-2.5 right-2.5 bg-violet-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
            {cartQuantity}
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full ring-1 ring-red-200">
              Tugagan
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-1.5">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="secondary">{product.category}</Badge>
            {product.distributor?.companyName && (
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[100px]">
                {product.distributor.companyName}
              </span>
            )}
          </div>
          {product.avgRating && product.avgRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(product.avgRating)} />
              <span className="text-xs text-slate-400">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-lg font-bold text-violet-600 leading-none">
              {product.price.toLocaleString('uz-UZ')}
              <span className="text-xs font-medium text-slate-400 ml-1">UZS</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">1 {product.unit}</p>
          </div>
          <span className={cn(
            'text-[11px] font-semibold px-2 py-1 rounded-lg',
            product.stock > 10
              ? 'bg-emerald-50 text-emerald-600'
              : product.stock > 0
              ? 'bg-amber-50 text-amber-600'
              : 'bg-red-50 text-red-500'
          )}>
            {product.stock} ta
          </span>
        </div>

        {/* Actions */}
        <div className="pt-1">
          {type === 'STORE_OWNER' ? (
            <Button
              className="w-full"
              size="sm"
              disabled={isOutOfStock}
              onClick={() => onAddCart?.(product)}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Savatga
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(product)}
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Tahrir
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="px-3"
                onClick={() => onDelete?.(product)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
