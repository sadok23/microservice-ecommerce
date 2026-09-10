import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { getProducts } from '@/api/client';
import type { Product } from '@/types';

/**
 * Reusable catalog query. All consumers share one cache entry.
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => getProducts(keycloak),
    placeholderData: keepPreviousData,
  });
}

/**
 * Builds a productId → Product map from the catalog query so order items
 * (which only carry productId) can be rendered with names + thumbnails.
 */
export function useProductMap(): Record<number, Product> {
  const { data } = useProducts();
  return useMemo(() => {
    const map: Record<number, Product> = {};
    for (const p of data ?? []) map[p.id] = p;
    return map;
  }, [data]);
}