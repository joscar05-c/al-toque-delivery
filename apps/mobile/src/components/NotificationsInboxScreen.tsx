import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateTime } from '@/lib/format';
import {
  fetchUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { NotificationRow } from '@delivery/shared';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface VisualStyle {
  icon: IconName;
  iconColor: string;
  bgClass: string;
}

function getNotificationVisual(type: string): VisualStyle {
  switch (type) {
    case 'order_accepted':
    case 'order_ready_pickup':
    case 'driver_order_ready':
    case 'driver_application_approved':
      return {
        icon: 'checkmark-circle',
        iconColor: '#059669',
        bgClass: 'bg-emerald-50',
      };
    case 'order_preparing':
    case 'driver_order_assigned':
    case 'driver_pool_order_ready':
      return {
        icon: 'flame',
        iconColor: '#D97706',
        bgClass: 'bg-amber-50',
      };
    case 'order_picked_up':
    case 'order_delivered':
      return {
        icon: 'bicycle',
        iconColor: '#208AEF',
        bgClass: 'bg-blue-50',
      };
    case 'order_cancelled':
    case 'driver_order_cancelled':
    case 'driver_application_rejected':
      return {
        icon: 'alert-circle',
        iconColor: '#DC2626',
        bgClass: 'bg-red-50',
      };
    default:
      return {
        icon: 'notifications',
        iconColor: '#208AEF',
        bgClass: 'bg-blue-50',
      };
  }
}

interface NotificationsInboxScreenProps {
  mode: 'client' | 'driver';
}

export function NotificationsInboxScreen({
  mode,
}: NotificationsInboxScreenProps) {
  const userId = useAuthStore((state) => state.session?.user.id);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial + suscripción Realtime a public.notifications
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchUserNotifications(userId)
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Error cargando notificaciones',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const channel = supabase
      .channel(`inbox_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const created = payload.new as NotificationRow;
          setItems((prev) =>
            prev.some((n) => n.id === created.id)
              ? prev
              : [created, ...prev],
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as NotificationRow;
          setItems((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleRefresh = useCallback(() => {
    if (!userId || isRefreshing) return;
    setIsRefreshing(true);
    void fetchUserNotifications(userId)
      .then((rows) => {
        setItems(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : 'Error recargando notificaciones',
        );
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [isRefreshing, userId]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items],
  );

  const visibleItems = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.is_read) : items),
    [filter, items],
  );

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsAsRead(userId);
    } catch (e) {
      console.warn('[notifications] Error marcando todas como leídas:', e);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handlePressItem = (item: NotificationRow) => {
    if (!item.is_read) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      );
      void markNotificationAsRead(item.id).catch((e: unknown) => {
        console.warn('[notifications] No se pudo marcar como leída:', e);
      });
    }

    const rawData =
      item.data && typeof item.data === 'object' && !Array.isArray(item.data)
        ? (item.data as Record<string, unknown>)
        : {};

    const orderId =
      typeof rawData.orderId === 'string'
        ? rawData.orderId
        : item.reference_id &&
            item.type !== 'driver_application_approved' &&
            item.type !== 'driver_application_rejected'
          ? item.reference_id
          : null;

    if (orderId) {
      if (mode === 'driver' || rawData.target === 'driver_order') {
        router.push({
          pathname: '/(driver)/order/[id]',
          params: { id: orderId },
        });
      } else {
        router.push({
          pathname: '/(client)/order/[id]',
          params: { id: orderId },
        });
      }
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Cabecera */}
      <View className="flex-row items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>

        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Mis Notificaciones
          </Text>
          <Text className="text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? 'aviso sin leer' : 'avisos sin leer'}`
              : 'Todo al día'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={() => void handleMarkAllRead()}
            disabled={isMarkingAll}
            className="flex-row items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 active:opacity-75"
          >
            <Ionicons
              name="checkmark-done-outline"
              size={16}
              color="#208AEF"
            />
            <Text className="text-xs font-bold text-primary">
              Marcar leídas
            </Text>
          </Pressable>
        )}
      </View>

      {/* Filtros Todas / No leídas */}
      <View className="flex-row gap-2 bg-white px-4 py-2.5 border-b border-slate-100">
        <Pressable
          onPress={() => setFilter('all')}
          className={`rounded-full px-3.5 py-1.5 ${
            filter === 'all' ? 'bg-slate-900' : 'bg-slate-100'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              filter === 'all' ? 'text-white' : 'text-slate-600'
            }`}
          >
            Todas ({items.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('unread')}
          className={`rounded-full px-3.5 py-1.5 ${
            filter === 'unread' ? 'bg-primary' : 'bg-slate-100'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              filter === 'unread' ? 'text-white' : 'text-slate-600'
            }`}
          >
            No leídas ({unreadCount})
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
          <Text className="text-center text-sm text-slate-500">{error}</Text>
          <Pressable
            onPress={handleRefresh}
            className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#208AEF"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-2.5 py-20 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons
                  name="notifications-off-outline"
                  size={30}
                  color="#94A3B8"
                />
              </View>
              <Text className="text-base font-bold text-slate-700">
                {filter === 'unread'
                  ? 'No tienes notificaciones pendientes'
                  : 'Aún no tienes notificaciones'}
              </Text>
              <Text className="text-center text-xs text-slate-400">
                {mode === 'driver'
                  ? 'Aquí aparecerán los avisos de nuevos pedidos asignados y actualizaciones de entregas.'
                  : 'Aquí verás el historial de estados de tus pedidos y avisos importantes.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const visual = getNotificationVisual(item.type);
            return (
              <Pressable
                onPress={() => handlePressItem(item)}
                className={`flex-row items-start gap-3 rounded-2xl border p-4 active:opacity-85 ${
                  item.is_read
                    ? 'border-slate-200 bg-white'
                    : 'border-blue-200 bg-blue-50/50'
                }`}
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-2xl ${visual.bgClass}`}
                >
                  <Ionicons
                    name={visual.icon}
                    size={20}
                    color={visual.iconColor}
                  />
                </View>

                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      className={`flex-1 text-sm ${
                        item.is_read
                          ? 'font-semibold text-slate-800'
                          : 'font-extrabold text-slate-900'
                      }`}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {!item.is_read && (
                      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </View>

                  <Text className="text-xs leading-4 text-slate-600">
                    {item.body}
                  </Text>

                  <Text className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

