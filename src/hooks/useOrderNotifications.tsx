import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_code: string;
  total_amount_cents: number;
  created_at: string;
  payment_status: string;
}

export const useOrderNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Order[]>([]);

  useEffect(() => {
    // Subscribe to new paid orders
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'payment_status=eq.paid'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          
          // Show toast notification
          toast({
            title: `New paid order #${newOrder.order_code || newOrder.id.slice(0, 8).toUpperCase()}`,
            description: `Total: €${(newOrder.total_amount_cents / 100).toFixed(2).replace('.', ',')}`,
            duration: 10000,
          });

          // Add to notifications list
          setNotifications(prev => [newOrder, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Optional: Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixz0fDTgjMGIGvA7+OZSA0PVqzn7rFgHgU2jun4w3MpBS5+z/LViTgHG2m98N+hTQ0NVKzn77FfHQU2j+T4w3YpBS2Cz/PWijgHG2q98d+jTQ0NVKzn8LFfHQU2j+P4w3YpBSx+z/PWijgHG2q98d+jTQ0OVKzn77BfHQU2j+P4w3YpBS6Bz/PWijgHG2q98N+hTQ0NVKzn7rFfHQU2juT4w3cpBSx+0PLWijgHGmy98N+hTQ0OVKzn7rFfHQU2j+T4w3YpBSx+z/PWijgHG2q98d+jTQ0NVKzn8LBfHQU2j+P4w3YpBS6Bz/PWijgHG2q98N+hTQ0OVKzn77FfHQU2j+P4w3YpBS6Bz/PWijgHG2q98N+hTQ0OVKzn77FfHQU2');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {
            // Ignore audio errors
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (orderId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== orderId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    unreadCount,
    notifications,
    markAsRead,
    clearAll,
  };
};