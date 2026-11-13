import { useEffect, useState } from 'react';

import { fetchUnreadNotificationsCount } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

interface SharedBadgeEntry {
  count: number;
  listeners: Set<(count: number) => void>;
  channel: ReturnType<typeof supabase.channel>;
  refresh: () => void;
}

const activeEntries = new Map<string, SharedBadgeEntry>();
let channelSeq = 0;

function subscribeUserUnreadCount(
  userId: string,
  listener: (count: number) => void,
): () => void {
  let entry = activeEntries.get(userId);

  if (!entry) {
    channelSeq += 1;
    const channelName = `unread_notifications_badge_${userId}_${channelSeq}`;
    const listeners = new Set<(count: number) => void>();

    const refresh = () => {
      void fetchUnreadNotificationsCount(userId)
        .then((count) => {
          const current = activeEntries.get(userId);
          if (!current) return;
          current.count = count;
          current.listeners.forEach((cb) => cb(count));
        })
        .catch((e: unknown) => {
          console.warn('[notifications-badge] Error consultando contador:', e);
        });
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refresh();
        },
      )
      .subscribe();

    entry = {
      count: 0,
      listeners,
      channel,
      refresh,
    };
    activeEntries.set(userId, entry);
  }

  entry.listeners.add(listener);
  listener(entry.count);
  entry.refresh();

  return () => {
    const current = activeEntries.get(userId);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      activeEntries.delete(userId);
      void supabase.removeChannel(current.channel);
    }
  };
}

/**
 * Mantiene en tiempo real el contador de notificaciones sin leer del usuario.
 * Comparte un único canal Realtime entre todas las pantallas montadas.
 */
export function useUnreadNotificationsCount(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    return subscribeUserUnreadCount(userId, setUnreadCount);
  }, [userId]);

  return userId ? unreadCount : 0;
}

