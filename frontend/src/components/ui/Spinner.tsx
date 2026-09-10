import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
  className?: string;
}

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };

export default function Spinner({
  size = 'md',
  light = false,
  className,
}: SpinnerProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        SIZES[size],
        light ? 'text-white' : 'text-violet-600 dark:text-violet-400',
        className
      )}
    />
  );
}