import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getOrder } from '@/api/client';
import type { Order } from '@/types';
import { useProductMap } from '@/hooks/useProductMap';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCurrency, formatDateTime } from '@/lib/format';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_HEADLINE: Record<Order['status'], { emoji: string; title: string; blurb: string }> = {
  CONFIRMED: {
    emoji: '🎉',
    title: 'Order confirmed!',
    blurb: 'Inventory has stock — your order is locked in.',
  },
  CANCELLED: {
    emoji: '😕',
    title: 'Order cancelled',
    blurb: "We couldn't fulfill this one. No charges were made.",
  },
  PENDING: {
    emoji: '⏳',
    title: 'Processing…',
    blurb: 'Waiting for inventory to confirm stock — this usually takes a second.',
  },
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const productMap = useProductMap();

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(keycloak, orderId),
    enabled: Number.isFinite(orderId),
    // Poll just while the order is still awaiting stock confirmation.
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 2000 : false),
  });

  useDocumentTitle(order ? `Order #${order.id} · ShopMicro` : 'Order · ShopMicro');

  if (isLoading || !order) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="mx-auto h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="🔎"
          title="Couldn't load this order"
          description="It may belong to a different account, or the service is unreachable."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const headline = STATUS_HEADLINE[order.status];

  return (
    <div className="page-container max-w-2xl">
      <Card className="overflow-hidden text-center">
        {/* Status banner */}
        <div
          className={
            order.status === 'PENDING'
              ? 'gradient-brand-bg px-8 py-10 text-white'
              : order.status === 'CONFIRMED'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-10 text-white'
                : 'bg-gradient-to-br from-gray-500 to-gray-700 px-8 py-10 text-white'
          }
        >
          <div
            className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-inner ${order.status === 'PENDING' ? 'animate-pulse' : ''}`}
            aria-hidden
          >
            {headline.emoji}
          </div>
          <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">{headline.title}</h1>
          <p className="text-sm opacity-90">{headline.blurb}</p>
          <div className="mt-4">
            <StatusBadge status={order.status} className="bg-white/90" />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Meta */}
          <div className="mb-6 grid grid-cols-2 gap-6 border-b border-gray-100 pb-6 text-left text-sm dark:border-gray-800">
            <div>
              <span className="text-gray-400">Order ID</span>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">#{order.id}</p>
            </div>
            <div>
              <span className="text-gray-400">Placed</span>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Items with real product names + thumbs */}
          <h3 className="mb-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-400">
            Items
          </h3>
          <ul className="mb-6 space-y-3 text-left">
            {order.items.map((item) => {
              const product = productMap[item.productId];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800/60"
                >
                  {product?.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-orange-100 text-lg dark:from-violet-900/40 dark:to-orange-900/40"
                      aria-hidden
                    >
                      🛍️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {product?.name ?? `Product #${item.productId}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Total */}
          <div className="mb-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4 dark:from-violet-950/40 dark:to-fuchsia-950/40">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Total</span>
            <span className="text-xl font-extrabold text-violet-600 dark:text-violet-400">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" to="/orders" className="flex-1">
              My Orders
            </Button>
            <Button to="/" className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}