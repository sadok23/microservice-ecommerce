import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatCurrency } from '@/lib/format';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CartItemRow from '@/components/CartItem';

export default function CartPage() {
  useDocumentTitle('Your Cart · ShopMicro');
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added anything yet — go grab something fun."
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
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">
          Your Cart
          <span className="ml-2 text-base font-medium text-gray-400">
            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <button
          onClick={() => setConfirmingClear(true)}
          className="text-sm font-semibold text-red-500 transition hover:text-red-700 dark:hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </div>

        {/* Sticky summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
            </div>
            <div className="p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalPrice)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Shipping</dt>
                  <dd className="font-medium text-green-600 dark:text-green-400">Free</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <dt className="font-bold text-gray-900 dark:text-gray-100">Total</dt>
                  <dd className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalPrice)}
                  </dd>
                </div>
              </dl>
              <Button to="/checkout" size="lg" className="mt-5 w-full">
                Proceed to Checkout
              </Button>
              <Button variant="ghost" to="/" className="mt-2 w-full">
                Continue shopping
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear the cart?"
        message="This removes every item from your cart."
        confirmText="Clear cart"
        danger
        onConfirm={() => {
          clearCart();
          setConfirmingClear(false);
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </div>
  );
}