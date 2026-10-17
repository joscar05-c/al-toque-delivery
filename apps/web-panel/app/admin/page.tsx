'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import { Users, ShoppingBag, Star } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const [usersRes, ordersRes, reviewsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
    supabase.from('reviews').select('id,q1_app_loading_speed,q2_product_selection_ease,q3_menu_navigation_ease,q4_order_accuracy,q5_payment_address_accuracy,q6_order_tracking_visibility,q7_communication_need,q8_delivery_timeliness,q9_app_vs_phone_speed,q10_overall_satisfaction,q11_recommendation_likelihood,comment,created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalDeliveredOrders = ordersRes.count ?? 0;

  const reviews = reviewsRes.data ?? [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => {
        const scores = [
          r.q1_app_loading_speed,
          r.q2_product_selection_ease,
          r.q3_menu_navigation_ease,
          r.q4_order_accuracy,
          r.q5_payment_address_accuracy,
          r.q6_order_tracking_visibility,
          r.q7_communication_need,
          r.q8_delivery_timeliness,
          r.q9_app_vs_phone_speed,
          r.q10_overall_satisfaction,
          r.q11_recommendation_likelihood,
        ];
        return sum + scores.reduce((a, b) => a + b, 0) / scores.length;
      }, 0) / reviews.length
    : 0;

  const kpis = [
    { label: 'Usuarios Registrados', value: totalUsers.toLocaleString(), icon: Users, color: 'var(--info)', bg: 'var(--info-soft)' },
    { label: 'Pedidos Entregados', value: totalDeliveredOrders.toLocaleString(), icon: ShoppingBag, color: 'var(--success)', bg: 'var(--success-soft)' },
    { label: 'Calificación Promedio', value: avgRating.toFixed(1), icon: Star, color: 'var(--warning)', bg: 'var(--warning-soft)', max: ' / 5' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="section-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--ink-muted)',
                  }}>
                    {kpi.label}
                  </p>
                  <p style={{
                    marginTop: '8px',
                    fontSize: '32px',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    color: 'var(--ink)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }} className="flex items-center gap-1">
                    {kpi.value}
                    {kpi.max && <span style={{ fontSize: '18px', fontWeight: 400, color: 'var(--ink-muted)' }}>{kpi.max}</span>}
                  </p>
                </div>
                <div
                  style={{
                    background: kpi.bg,
                    color: kpi.color,
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent reviews */}
      <div className="section-card overflow-hidden">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex items-center gap-3">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--warning-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Star style={{ width: '16px', height: '16px', color: 'var(--warning)' }} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
            Últimas Reseñas
          </h2>
        </div>
        <div>
          {reviews.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--ink-muted)',
              fontSize: '14px',
            }}>
              No hay reseñas registradas
            </div>
          ) : (
            reviews.map((r, i) => {
              const scores = [
                r.q1_app_loading_speed,
                r.q2_product_selection_ease,
                r.q3_menu_navigation_ease,
                r.q4_order_accuracy,
                r.q5_payment_address_accuracy,
                r.q6_order_tracking_visibility,
                r.q7_communication_need,
                r.q8_delivery_timeliness,
                r.q9_app_vs_phone_speed,
                r.q10_overall_satisfaction,
                r.q11_recommendation_likelihood,
              ];
              const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              return (
                <div
                  key={r.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: i < reviews.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="badge badge-warning"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <Star style={{ width: '12px', height: '12px' }} fill="currentColor" />
                      {avg.toFixed(1)}
                    </span>
                    <time style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {new Date(r.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  {r.comment && (
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--ink-secondary)',
                      lineHeight: 1.5,
                      marginTop: '4px',
                    }}>
                      {r.comment}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
