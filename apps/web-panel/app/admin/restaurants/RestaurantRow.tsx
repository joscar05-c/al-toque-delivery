'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toggleRestaurantActive, toggleRestaurantPartner } from './actions';
import { RestaurantItem } from './RestaurantEditModal';
import { Edit2, Star, Clock, Store, Phone, Utensils, Settings } from 'lucide-react';

interface RestaurantRowProps {
  restaurant: RestaurantItem;
  onEdit: () => void;
}

export default function RestaurantRow({
  restaurant,
  onEdit,
}: RestaurantRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleRestaurantActive(restaurant.id, restaurant.is_active);
      if (result.error) setError(result.error);
    });
  }

  function handleTogglePartner() {
    setError(null);
    startTransition(async () => {
      const result = await toggleRestaurantPartner(restaurant.id, !!restaurant.is_partner);
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Restaurante */}
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border)',
            }}
          >
            {restaurant.image_url ? (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store style={{ width: '18px', height: '18px', color: 'var(--brand)' }} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
                {restaurant.name}
              </span>
              {restaurant.is_partner && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
                  title="Restaurante Socio / Destacado"
                >
                  ★ Partner
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
              <span>{restaurant.category?.name || 'Sin categoría'}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock style={{ width: '11px', height: '11px' }} />
                {restaurant.average_prep_time || 15} min
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Propietario */}
      <td>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
          {restaurant.owner?.name ? (
            restaurant.owner.name
          ) : (
            <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontWeight: 400 }}>
              Sin asignar
            </span>
          )}
        </div>
        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
          <Phone style={{ width: '11px', height: '11px' }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {restaurant.owner?.phone || restaurant.phone || '—'}
          </span>
        </div>
      </td>

      {/* Ciudad y Dirección */}
      <td>
        <div className="flex items-center gap-1">
          <span className="badge badge-info text-[11px] capitalize">
            {restaurant.city}
          </span>
        </div>
        <div
          className="text-xs mt-1 truncate max-w-[200px]"
          style={{ color: 'var(--ink-secondary)' }}
          title={restaurant.address}
        >
          {restaurant.address}
        </div>
      </td>

      {/* Métricas */}
      <td>
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--ink)' }}>
          <Star style={{ width: '13px', height: '13px', color: 'var(--warning)', fill: 'var(--warning)' }} />
          <span>{restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.5'}</span>
          <span className="text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>
            ({restaurant.total_reviews ?? 0})
          </span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {restaurant.sales_count ?? 0} pedidos
        </div>
      </td>

      {/* Estado y Partner */}
      <td>
        <div className="flex flex-col gap-1.5 items-start">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`badge transition-opacity hover:opacity-80 cursor-pointer ${
              restaurant.is_active ? 'badge-success' : 'badge-neutral'
            }`}
            title="Haz clic para cambiar estado activo/suspendido"
          >
            {restaurant.is_active ? '● Activo' : '○ Pausado'}
          </button>

          <button
            type="button"
            onClick={handleTogglePartner}
            disabled={isPending}
            className="text-[11px] hover:underline cursor-pointer flex items-center gap-1"
            style={{ color: restaurant.is_partner ? 'var(--warning)' : 'var(--ink-muted)' }}
            title="Alternar estado Partner"
          >
            <Star style={{ width: '11px', height: '11px', fill: restaurant.is_partner ? 'currentColor' : 'none' }} />
            {restaurant.is_partner ? 'Es Partner' : 'Hacer Partner'}
          </button>
        </div>
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <Link
            href={`/restaurant/menu?restaurantId=${restaurant.id}`}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px', textDecoration: 'none' }}
            title="Gestionar carta, categorías y platos como Admin"
          >
            <Utensils style={{ width: '13px', height: '13px', color: 'var(--brand)' }} />
            <span>Carta</span>
          </Link>

          <Link
            href={`/restaurant/config?restaurantId=${restaurant.id}`}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px', textDecoration: 'none' }}
            title="Configurar delivery, fotos y datos de tienda como Admin"
          >
            <Settings style={{ width: '13px', height: '13px' }} />
            <span>Ajustes</span>
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Editar datos básicos y reasignar propietario"
          >
            <Edit2 style={{ width: '13px', height: '13px' }} />
            <span>Editar</span>
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '4px', color: 'var(--danger)', fontSize: '11px', textAlign: 'right' }}>
            {error}
          </div>
        )}
      </td>
    </tr>
  );
}
