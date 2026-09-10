import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getProduct, getStock } from '@/api/client';
import type { Stock } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCurrency } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import QuantitySelector from '@/components/ui/QuantitySelector';
import EmptyState from '@/components/ui/EmptyState';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const toast = useToast();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(keycloak, productId),
    enabled: Number.isFinite(productId),
  });

  // Stock cap: quantity selector is limited to available stock so customers
  // can't over-order what inventory can't fulfill.
  const { data: stockRows } = useQuery<Stock[]>({
    queryKey: ['stock'],
    queryFn: () => getStock(keycloak),
  });
  const stockMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const s of stockRows ?? []) map[s.productId] = s.quantityAvailable;
    return map;
  }, [stockRows]);

  const available = product ? stockMap[product.id] ?? 999 : 0;
  const outOfStock = !product?.inStock || available <= 0;

  useDocumentTitle(product ? `${product.name} · ShopMicro` : 'Product · ShopMicro');

  const handleAdd = () => {
    if (!product || outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
    });
    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-8 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="🔎"
          title="Product not found"
          description={isError ? 'The catalog may be unreachable right now.' : 'It may have been removed from the store.'}
          action={
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button variant="ghost" to="/">
                Back to products
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: product.category || 'Products', to: '/' },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl" aria-hidden>
              🛍️
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={product.inStock ? 'green' : 'red'} dot>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </Badge>
            {product.category && (
              <Badge tone="violet">{product.category}</Badge>
            )}
          </div>

          <h1 className="mb-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
            {product.name}
          </h1>

          <p className="mb-6 text-4xl font-bold text-violet-600 dark:text-violet-400">
            {formatCurrency(product.price)}
          </p>

          {product.description && (
            <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-300">
              {product.description}
            </p>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-4">
              {!outOfStock && (
                <>
                  <QuantitySelector
                    value={quantity}
                    min={1}
                    max={Math.max(1, available)}
                    onChange={setQuantity}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {available} available
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={outOfStock}
                className="flex-1 sm:flex-none sm:min-w-56"
              >
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline" to="/cart">
                View Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}