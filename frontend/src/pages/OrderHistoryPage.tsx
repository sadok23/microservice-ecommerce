import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getMyOrders } from '@/api/client';
import type { Order } from '@/types';
import { useProductMap } from '@/hooks/useProductMap';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCurrency, formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function OrderHistoryPage() {
  useDocumentTitle('My Orders · ShopMicro');
  const productMap = useProductMap();

  const { data: orders, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ['orders', 'mine'],
    queryFn: () => getMyOrders(keycloak),
  });

  if (isLoading) {
    return (
      <div className="page-container max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="💥"
          title="Couldn't load your orders"
          description="The order service may be unreachable right now."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="🧾"
          title="No orders yet"
          description="When you place an order it'll show up here with live status."
          action={
            <Button size="lg" to="/">
              Browse Products
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <h1 className="mb-6 text-2xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const previews = order.items
            .map((i) => productMap[i.productId]?.name ?? `Product #${i.productId}`)
            .slice(0, 3)
            .join(', ');
          return (
            <Link key={order.id} to={`/orders/${order.id}`} className="block">
              <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-gray-100">Order #{order.id}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                    {previews && (
                      <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                        {previews}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-extrabold text-gray-900 dark:text-gray-100">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}