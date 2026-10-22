'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface RestaurantOption {
  id: string;
  name: string;
  image_url?: string | null;
}

interface RestaurantSelectorProps {
  restaurants: RestaurantOption[];
  currentId: string;
}

export default function RestaurantSelector({ restaurants, currentId }: RestaurantSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (restaurants.length <= 1) {
    const single = restaurants[0];
    if (!single) return null;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink-secondary)]">
        <svg className="w-4 h-4 text-[var(--brand)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-1.5 9H4.5L3 3zm0 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
        </svg>
        <span className="font-semibold text-[var(--ink)]">{single.name}</span>
      </div>
    );
  }

  const handleSelect = (newId: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('restaurantId', newId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const current = restaurants.find((r) => r.id === currentId) || restaurants[0];

  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xs">
        <svg className="w-4 h-4 text-[var(--brand)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-1.5 9H4.5L3 3zm0 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-[var(--ink-muted)] tracking-wider">
            Restaurante Activo
          </span>
          <div className="relative flex items-center">
            <select
              value={current?.id}
              onChange={(e) => handleSelect(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[var(--ink)] pr-6 cursor-pointer focus:outline-none appearance-none"
            >
              {restaurants.map((rest) => (
                <option key={rest.id} value={rest.id}>
                  {rest.name}
                </option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute right-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
