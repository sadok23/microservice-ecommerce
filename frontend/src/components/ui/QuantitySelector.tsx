import { cn } from '@/lib/cn';

interface QuantitySelectorProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const step = disabled
    ? 'cursor-not-allowed opacity-60'
    : 'hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700',
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          'flex h-9 w-9 items-center justify-center text-gray-600 dark:text-gray-300',
          step
        )}
      >
        −
      </button>
      <span
        className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        className={cn(
          'flex h-9 w-9 items-center justify-center text-gray-600 dark:text-gray-300',
          step
        )}
      >
        +
      </button>
    </div>
  );
}