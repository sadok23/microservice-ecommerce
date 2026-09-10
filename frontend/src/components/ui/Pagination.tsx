import Button from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Renders prev/next + numbered buttons with gap handling for long ranges.
 */
export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>([1, totalPages]);
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.add(p);
  const list = [...pages].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </Button>
      {list.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && list[i - 1] !== p - 1 && (
            <span className="px-1 text-sm text-gray-400">…</span>
          )}
          <Button
            size="sm"
            variant={p === page ? 'primary' : 'outline'}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </Button>
    </nav>
  );
}