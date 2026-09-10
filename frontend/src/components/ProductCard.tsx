import { Link } from 'react-router';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Badge from './ui/Badge';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate
    addItem({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={product.imageUrl || '/images/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Quick-add */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            disabled={!product.inStock}
            className={cn(
              'w-full rounded-xl py-2 text-sm font-semibold shadow-lg backdrop-blur transition',
              product.inStock
                ? 'bg-white/95 text-violet-700 hover:bg-white dark:bg-gray-900/90 dark:text-violet-300 dark:hover:bg-gray-900'
                : 'cursor-not-allowed bg-gray-100/80 text-gray-400 dark:bg-gray-800/80'
            )}
          >
            {product.inStock ? '+ Quick Add' : 'Out of Stock'}
          </button>
        </div>

        {/* Category chip */}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {product.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-violet-600 dark:text-gray-100 dark:group-hover:text-violet-400">
            {product.name}
          </h3>
          <Badge tone={product.inStock ? 'green' : 'red'} dot className="shrink-0">
            {product.inStock ? 'In' : 'Out'}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {product.description || '—'}
        </p>
        <p className="mt-auto pt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(product.price)}
        </p>
      </div>
    </Link>
  );
}