import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getOrders, getStock } from '@/api/client';
import type { Order, Stock } from '@/types';
import { useProducts } from '@/hooks/useProductMap';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

function StatCard({
  emoji,
  label,
  value,
  loading,
  href,
  cta,
}: {
  emoji: string;
  label: string;
  value: string | number;
  loading?: boolean;
  href?: string;
  cta?: string;
}) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-orange-100 text-xl dark:from-violet-900/40 dark:to-orange-900/40">
        <span aria-hidden>{emoji}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      )}
      {href && (
        <Link
          to={href}
          className="mt-3 inline-block text-sm font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
        >
          {cta ?? 'Open'} →
        </Link>
      )}
    </Card>
  );
}

/**
 * Admin landing: headline numbers + quick links into the management tabs.
 */
export default function AdminPage() {
  useDocumentTitle('Dashboard · ShopMicro Admin');

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => getOrders(keycloak),
  });
  const { data: stockRows, isLoading: stockLoading } = useQuery<Stock[]>({
    queryKey: ['stock'],
    queryFn: () => getStock(keycloak),
  });

  const pending = orders?.filter((o) => o.status === 'PENDING').length ?? 0;
  const totalStock = stockRows?.reduce((sum, s) => sum + s.quantityAvailable, 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Store health at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          emoji="📦"
          label="Products"
          value={products?.length ?? 0}
          loading={productsLoading}
          href="/admin/products"
          cta="Manage products"
        />
        <StatCard
          emoji="🧾"
          label="Orders"
          value={orders?.length ?? 0}
          loading={ordersLoading}
          href="/admin/orders"
          cta="View orders"
        />
        <StatCard
          emoji="⏳"
          label="Pending orders"
          value={pending}
          loading={ordersLoading}
          href="/admin/orders"
          cta="Review queue"
        />
        <StatCard
          emoji="🏬"
          label="Units in stock"
          value={totalStock}
          loading={stockLoading}
          href="/admin/stock"
          cta="Manage stock"
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            emoji: '📦',
            title: 'Products',
            desc: 'Create, edit and remove products with live image previews.',
            to: '/admin/products',
          },
          {
            emoji: '🏬',
            title: 'Stock',
            desc: 'Adjust quantities per product — synced to the storefront via Kafka.',
            to: '/admin/stock',
          },
          {
            emoji: '🧾',
            title: 'Orders',
            desc: 'Move orders through PENDING → CONFIRMED → CANCELLED.',
            to: '/admin/orders',
          },
        ].map((c) => (
          <Card key={c.to} className="flex flex-col p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-orange-100 text-lg dark:from-violet-900/40 dark:to-orange-900/40">
              <span aria-hidden>{c.emoji}</span>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{c.title}</h2>
            <p className="mb-4 mt-1 flex-1 text-sm text-gray-500 dark:text-gray-400">{c.desc}</p>
            <Button variant="outline" size="sm" to={c.to} className="self-start">
              Open {c.title}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}