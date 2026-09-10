import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { deleteProduct, deleteStock } from '@/api/client';
import { useProducts } from '@/hooks/useProductMap';
import type { Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import ProductForm from './ProductForm';

function Thumb({ url }: { url: string }) {
  return url ? (
    <img src={url} alt="" className="h-10 w-10 rounded-lg object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-orange-100 text-lg dark:from-violet-900/40 dark:to-orange-900/40" aria-hidden>
      🛍️
    </div>
  );
}

/**
 * Admin product table: full CRUD. Delete removes stock first (best-effort)
 * so the catalog's inStock cache doesn't reference a ghost product.
 */
export default function AdminProductsPage() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      // Best-effort: drop the stock row so no inventory.updated event fires later.
      await deleteStock(keycloak, deleting.id).catch(() => undefined);
      await deleteProduct(keycloak, deleting.id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(`Deleted ${deleting.name}`);
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-red-500">Couldn't load products.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{products?.length ?? 0} total</p>
        </div>
        <Button onClick={openCreate} leftIcon={<span aria-hidden>＋</span>}>
          New Product
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="No products yet"
          description="Create your first product to get the store rolling."
          action={
            <Button onClick={openCreate} leftIcon={<span aria-hidden>＋</span>}>
              New Product
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb url={p.imageUrl} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                          <p className="text-xs text-gray-400">#{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {p.category || '—'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={p.inStock ? 'green' : 'gray'} dot>
                        {p.inStock ? 'In stock' : 'Out of stock'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                          onClick={() => setDeleting(p)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductForm open={formOpen} product={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        message="This permanently removes the product and its stock. Customers won't be able to see it anymore."
        confirmText="Delete"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}