import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  emoji = '🛍️',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900/50">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-orange-100 text-3xl dark:from-violet-900/40 dark:to-orange-900/40">
        <span aria-hidden>{emoji}</span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mb-5 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action}
    </div>
  );
}