'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton } from '@/components/SignOutButton';

const navGroups = [
  {
    title: 'Operaciones',
    items: [
      { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
      { href: '/admin/orders', icon: 'orders', label: 'Monitor Pedidos' },
    ],
  },
  {
    title: 'Comercios & Menús',
    items: [
      { href: '/admin/restaurants', icon: 'store', label: 'Restaurantes' },
      { href: '/admin/menus', icon: 'menu', label: 'Supervisión Menús' },
      { href: '/admin/categories', icon: 'tag', label: 'Categorías' },
      { href: '/admin/applications', icon: 'document', label: 'Solicitudes Locales' },
    ],
  },
  {
    title: 'Repartidores',
    items: [
      { href: '/admin/drivers', icon: 'truck', label: 'Repartidores & Mapa' },
      { href: '/admin/drivers/applications', icon: 'driver-app', label: 'Solicitudes Drivers' },
    ],
  },
  {
    title: 'Plataforma',
    items: [
      { href: '/admin/payments', icon: 'payments', label: 'Finanzas & Pagos' },
      { href: '/admin/users', icon: 'users', label: 'Usuarios & Roles' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Al Toque"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark)' }}>Al Toque</h1>
            <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'var(--ink-muted-on-dark)' }}>Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--ink-muted-on-dark)', opacity: 0.7 }}
              >
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="sidebar-link"
                      data-active={isActive}
                      title={item.label}
                    >
                      <SidebarIcon name={item.icon} />
                      <span className="sidebar-link-text">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Al Toque"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark)' }}>Al Toque</h1>
            <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: 'var(--ink-muted-on-dark)' }}>Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--ink-muted-on-dark)', opacity: 0.7 }}
              >
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="sidebar-link"
                      data-active={isActive}
                      onClick={() => setMobileOpen(false)}
                    >
                      <SidebarIcon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarIcon({ name }: { name: string }) {
  const cls = "w-[18px] h-[18px]";
  switch (name) {
    case 'dashboard':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'orders':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 'document':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'tag':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case 'store':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l1.5-6h15L21 10M5 10v10h14V10M3 10a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
        </svg>
      );
    case 'menu':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'truck':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5h-2m-4 0h2" />
        </svg>
      );
    case 'driver-app':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      );
    case 'payments':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return null;
  }
}
