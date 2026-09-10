import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getStock, createStock, updateStockQuantity, deleteStock } from '@/api/client';
import type { Product, Stock } from '@/types';
import { useProducts } from '@/hooks/useProductMap';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import QuantitySelector from '@/components/ui/QuantitySelector';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';

/**
 * Stock worksheet: every product, editable quantity, inline Save + Remove.
 * Saving PUTs the new quantity which publishes an `inventory.updated`
 * Kafka event — so the storefront's in-stock badge updates live.
 */
export default function AdminStockPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const {
    data: stockRows = [],
    isLoading: stockLoading,
    refetch,
  } = useQuery<Stock[]>({
    queryKey: ['stock'],
    queryFn: () => getStock(keycloak),
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  // Draft quantities keyed by productId.
  const [drafts, setDrafts] = useState<Record<number, number>>({});
  const [removing, setRemoving] = useState<Stock | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const stockByProduct = useMemo(() => {
    const map: Record<number, Stock> = {};
    for (const s of stockRows) map[s.productId] = s;
    return map;
  }, [stockRows]);

  const valueFor = (productId: number) => drafts[productId] ?? stockByProduct[productId]?.quantityAvailable ?? 0;
  const isDirty = (productId: number) =>
    drafts[productId] !== undefined && drafts[productId] !== stockByProduct[productId]?.quantityAvailable;

  const saveMutation = useMutation({
    mutationFn: (v: { product: Product; quantity: number }) =>
      stockByProduct[v.product.id]
        ? updateStockQuantity(keycloak, v.product.id, { quantityAvailable: v.quantity })
        : createStock(keycloak, { productId: v.product.id, quantityAvailable: v.quantity }),
    onSuccess: (_data, v) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDrafts((d) => {
        const next = { ...d };
        delete next[v.product.id];
        return next;
      });
      toast.success(`Saved stock for ${v.product.name}`);
    },
    onError: (err, v) => {
      toast.error(
        err instanceof Error ? `${err.message} (${v.product.name})` : 'Could not save stock'
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (stock: Stock) => deleteStock(keycloak, stock.productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock row removed — product is now out of stock');
      setRemoving(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not remove stock');
    },
    onSettled: () => setRemoveLoading(false),
  });

  const loading = productsLoading || stockLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        emoji="📦"
        title="No products to manage"
        description="Add products first — stock rows are created per product."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quantities are synced to the storefront via Kafka.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Availability</th>
                <th className="px-5 py-3 font-semibold">Quantity</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const row = stockByProduct[p.id];
                const value = valueFor(p.id);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-400">#{p.id}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={row && row.quantityAvailable > 0 ? 'green' : 'gray'} dot>
                        {row ? (row.quantityAvailable > 0 ? 'In stock' : 'Out of stock') : 'No stock row'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <QuantitySelector
                        value={value}
                        min={0}
                        onChange={(n) => setDrafts((d) => ({ ...d, [p.id]: n }))}
                        disabled={saveMutation.isPending}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isDirty(p.id) || saveMutation.isPending}
                          loading={saveMutation.isPending && saveMutation.variables?.product.id === p.id}
                          onClick={() => saveMutation.mutate({ product: p, quantity: value })}
                        >
                          Save
                        </Button>
                        {row && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            onClick={() => setRemoving(row)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 text-right">
        <Button variant="ghost" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <ConfirmDialog
        open={removing !== null}
        title="Remove stock row?"
        message="This sets the product to out-of-stock. Customers will see it as unavailable until stock is re-added."
        confirmText="Remove"
        danger
        loading={removeLoading}
        onConfirm={() => {
          if (removing) {
            setRemoveLoading(true);
            removeMutation.mutate(removing);
          }
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}