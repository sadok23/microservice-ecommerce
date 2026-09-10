import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProductMap';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ProductCard from '@/components/ProductCard';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 12;

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
  { value: 'newest', label: 'Newest' },
];

export default function HomePage() {
  useDocumentTitle('ShopMicro · Fresh finds, playful prices');

  const { data: products, isLoading, isError, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of products ?? []) if (p.category) seen.add(p.category);
    return [...seen].sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = (products ?? []).filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      const matchesCategory = !category || p.category === category;
      return matchesSearch && matchesCategory;
    });

    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'newest':
        return [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return list;
    }
  }, [products, debouncedSearch, category, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = debouncedSearch.trim() !== '' || category !== '';

  return (
    <div className="page-container">
      {/* Hero */}
      <section className="hero-float relative -mx-4 mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 px-6 py-12 text-white sm:-mx-6 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-8 -top-8 text-[10rem] opacity-15" aria-hidden>
          🛍️
        </div>
        <div className="relative max-w-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/80">
            ShopMicro
          </p>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight sm:text-5xl">
            Fresh finds, playful prices.
          </h1>
          <p className="mb-6 text-white/90">
            Search the catalog, add to cart with one tap, and watch your order update
            the moment inventory confirms it.
          </p>
          <div className="relative">
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products… try “Keyboard” or “Mouse”"
              className="border-transparent bg-white/95 py-3 text-gray-900 shadow-xl shadow-violet-900/20 placeholder:text-gray-400"
              aria-label="Search products"
            />
          </div>
        </div>
      </section>

      {isError ? (
        <EmptyState
          emoji="💥"
          title="Couldn't load products"
          description="The catalog service may be down. Give it another try."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <ProductGridSkeleton count={12} />
      ) : (
        <>
          {/* Filter / sort bar */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setCategory('');
                  setPage(1);
                }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                  category === ''
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                    category === c
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </p>
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                aria-label="Sort products"
                className="w-40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="No matches"
              description="Nothing fits those filters — try widening the search."
              action={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setCategory('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}