import { cn } from '@/lib/cn';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800',
        className
      )}
    />
  );
}