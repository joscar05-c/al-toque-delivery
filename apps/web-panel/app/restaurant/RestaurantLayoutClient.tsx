'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { SignOutButton } from '@/components/SignOutButton';

const navItems = [
  { href: '/restaurant/orders', icon: 'orders', label: 'Pedidos en Vivo' },
  { href: '/restaurant/menu', icon: 'menu', label: 'Menú & Platos' },
  { href: '/restaurant/config', icon: 'settings', label: 'Ajustes & Delivery' },
];

function RestaurantNavList({
  isAdmin,
  onNavigate,
}: {
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  return (
    <>
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/restaurant/orders' && pathname?.startsWith(item.href));
          const targetHref = restaurantId ? `${item.href}?restaurantId=${restaurantId}` : item.href;
          return (
            <Link
              key={item.href}
              href={targetHref}
              className="sidebar-link"
              data-active={isActive}
              title={item.label}
              onClick={onNavigate}
            >
              <SidebarIcon name={item.icon} />
              <span className="sidebar-link-text">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {isAdmin && (
        <div className="pt-3 mt-4 border-t border-[var(--border-on-dark)] space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            Super Admin
          </div>
          <Link
            href="/admin/restaurants"
            className="sidebar-link text-amber-400 hover:text-amber-300"
            title="Volver a lista de restaurantes en Super Admin"
            onClick={onNavigate}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="sidebar-link-text font-semibold">Volver a Super Admin</span>
          </Link>
          <Link
            href="/admin/menus"
            className="sidebar-link"
            title="Supervisión global de menús"
            onClick={onNavigate}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="sidebar-link-text">Supervisión Menús</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default function RestaurantLayoutClient({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--canvas)', overflowX: 'hidden' }}>
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay lg:hidden ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <aside
        className="sidebar-desktop min-h-screen fixed top-0 left-0 z-20 hidden lg:flex flex-col w-[260px]"
        style={{ background: 'var(--surface-sidebar)' }}
      >
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-on-dark)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <h1 className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark)' }}>Al Toque</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'var(--ink-muted-on-dark)' }}>Restaurante</span>
              {isAdmin && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Suspense fallback={null}>
            <RestaurantNavList isAdmin={isAdmin} />
          </Suspense>
        </nav>

        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border-on-dark)' }}>
          <div className="pt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`sidebar-mobile lg:hidden flex flex-col ${mobileOpen ? 'open' : ''}`}
        style={{ background: 'var(--surface-sidebar)' }}
      >
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-on-dark)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark)' }}>Al Toque</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'var(--ink-muted-on-dark)' }}>Restaurante</span>
              {isAdmin && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Suspense fallback={null}>
            <RestaurantNavList isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
          </Suspense>
        </nav>

        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border-on-dark)' }}>
          <div className="pt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 content-mobile min-w-0 p-4 md:p-6 lg:p-8 min-h-screen lg:ml-[260px]">
        <div className="pt-16 lg:pt-0">
          {isAdmin && (
            <div className="mb-6 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <div>
                  <span className="font-bold text-amber-950">Modo Super Admin:</span>{' '}
                  <span className="text-amber-900">
                    Estás gestionando la carta y configuración de este restaurante. Usa el selector arriba para alternar entre locales.
                  </span>
                </div>
              </div>
              <Link
                href="/admin/restaurants"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                <span>← Volver a Super Admin</span>
              </Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarIcon({ name }: { name: string }) {
  const cls = "w-[18px] h-[18px]";
  switch (name) {
    case 'orders':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2zm0 0h-6M16 11l3 3m0 0l-3 3m3-3H8" />
        </svg>
      );
    case 'menu':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}
