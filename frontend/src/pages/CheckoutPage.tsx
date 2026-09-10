import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { createOrder } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCurrency } from '@/lib/format';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function CheckoutPage() {
  useDocumentTitle('Checkout · ShopMicro');
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder(keycloak, {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    onSuccess: (order) => {
      clearCart();
      setConfirming(false);
      toast.success(`Order #${order.id} placed!`);
      navigate(`/orders/${order.id}`);
    },
    onError: (err) => {
      setConfirming(false);
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
    },
  });

  if (items.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="🧺"
          title="Your cart is empty"
          description="Add something to your cart before checking out."
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
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

      <h1 className="mb-6 text-2xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">
        Checkout
      </h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Order summary */}
        <Card className="self-start overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
          </div>
          <div className="p-5">
            <ul className="mb-4 space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 text-sm">
                  <img
                    src={item.imageUrl || '/images/placeholder.png'}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                  <span className="text-gray-400">× {item.quantity}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-xl font-extrabold text-violet-600 dark:text-violet-400">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        </Card>

        {/* Place order */}
        <Card className="flex flex-col self-start gap-4 p-6">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Almost there!</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review your order above and confirm to place it. Inventory will confirm
              stock shortly after.
            </p>
          </div>

          {placeOrder.isError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {placeOrder.error instanceof Error ? placeOrder.error.message : 'Failed to place order'}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={() => setConfirming(true)}
          >
            Place Order
          </Button>
          <Link
            to="/cart"
            className="text-center text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to cart
          </Link>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Confirm your order?"
        message={`You're about to place an order for ${formatCurrency(totalPrice)} (${items.length} item${items.length !== 1 ? 's' : ''}).`}
        confirmText="Place Order"
        loading={placeOrder.isPending}
        onConfirm={() => placeOrder.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}