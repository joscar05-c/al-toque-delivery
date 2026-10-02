'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Users, ShoppingBag, Star } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    { label: 'Usuarios Registrados', value: totalUsers.toLocaleString(), icon: Users, color: 'bg-blue-500' },
    { label: 'Pedidos Entregados', value: totalDeliveredOrders.toLocaleString(), icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Calificación Promedio', value: avgRating.toFixed(1), icon: Star, color: 'bg-amber-500', max: ' / 5' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Resumen general de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 flex items-center gap-1">
                    {kpi.value}
                    {kpi.max && <span className="text-xl font-normal text-gray-400">{kpi.max}</span>}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Últimas Reseñas Recibidas
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {reviews.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No hay reseñas registradas
            </div>
          ) : (
            reviews.map((r) => {
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
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {avg.toFixed(1)} / 5
                      </span>
                      <time className="text-sm text-gray-500">
                        {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{r.comment}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}