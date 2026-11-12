import { useEffect, useState } from 'react';

import { fetchUnreadNotificationsCount } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

/**
 * Mantiene en tiempo real el contador de notificaciones sin leer del usuario.
 */
export function useUnreadNotificationsCount(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const refreshCount = () => {
      void fetchUnreadNotificationsCount(userId)
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch((e: unknown) => {
          console.warn('[notifications-badge] Error consultando contador:', e);
        });
    };

    refreshCount();

    const channel = supabase
      .channel(`unread_notifications_badge_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshCount();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}

