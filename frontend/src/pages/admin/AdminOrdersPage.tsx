import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getOrders, updateOrderStatus } from '@/api/client';
import type { Order } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';

const STATUSES: Order['status'][] = ['PENDING', 'CONFIRMED', 'CANCELLED'];

function shortId(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 10)}…`;
}

/**
 * Admin order queue: every order with an in-place status change.
 * Changing status → ConfirmDialog → PUT /api/orders/{id}/status
 * → the storefront badge reflects it immediately (same cache key).
 */
export default function AdminOrdersPage() {
  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => getOrders(keycloak),
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const [pendingChange, setPendingChange] = useState<{ order: Order; next: Order['status'] } | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  const changeMutation = useMutation({
    mutationFn: (v: { order: Order; next: Order['status'] }) =>
      updateOrderStatus(keycloak, v.order.id, { status: v.next }),
    onSuccess: (_data, v) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: [`order`, v.order.id] });
      toast.success(`Order #${v.order.id} → ${v.next}`);
      setPendingChange(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    },
    onSettled: () => setChangeLoading(false),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-red-500">Couldn't load orders.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="No orders yet"
        description="Orders placed in the storefront will appear here."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} total</p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 dark:text-gray-100">Order #{order.id}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(order.createdAt)} · {order.items.length} item
                  {order.items.length !== 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Customer: {shortId(order.customerId)}</p>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-right text-sm text-gray-500 dark:text-gray-400">
                  Total
                  <span className="block text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </p>
                <select
                  aria-label={`Change status for order ${order.id}`}
                  value={order.status}
                  disabled={changeMutation.isPending}
                  onChange={(e) =>
                    setPendingChange({
                      order,
                      next: e.target.value as Order['status'],
                    })
                  }
                  className="cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingChange !== null}
        title={
          pendingChange
            ? `Set order #${pendingChange.order.id} to ${pendingChange.next}?`
            : ''
        }
        message="Customers will see the updated status on their order confirmation page."
        confirmText="Update status"
        loading={changeLoading}
        onConfirm={() => {
          if (pendingChange) {
            setChangeLoading(true);
            changeMutation.mutate(pendingChange);
          }
        }}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
}