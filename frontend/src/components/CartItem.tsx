import { useCart } from '@/context/CartContext';
import type { CartItem as CartItemType } from '@/types';
import { formatCurrency } from '@/lib/format';
import QuantitySelector from './ui/QuantitySelector';
import Button from './ui/Button';

export default function CartItemRow({ item, max = undefined }: { item: CartItemType; max?: number }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        <img
          src={item.imageUrl || '/images/placeholder.png'}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(item.price)} each
        </p>
      </div>

      <QuantitySelector
        value={item.quantity}
        min={1}
        max={max}
        onChange={(n) => updateQuantity(item.productId, n)}
      />

      <p className="w-20 text-right font-bold text-gray-900 dark:text-gray-100">
        {formatCurrency(item.price * item.quantity)}
      </p>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(item.productId)}
        aria-label={`Remove ${item.name} from cart`}
        className="text-gray-400 hover:text-red-500"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
}