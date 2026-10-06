export interface PushAlert {
  id: string;
  title: string;
  body: string;
  icon?: string;
  orderId?: string;
  timestamp: number;
}

type PushListener = (alert: PushAlert) => void;

class PushNotificationService {
  private listeners: Set<PushListener> = new Set();

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public sendNotification(title: string, body: string, orderId?: string) {
    const alert: PushAlert = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      orderId,
      timestamp: Date.now(),
    };

    // 1. Notify all in-app listeners
    this.listeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.error('Error notifying in-app listener:', err);
      }
    });

    // 2. Trigger native Web Notification if allowed
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=128&q=80',
            badge: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=128&q=80',
            tag: orderId || 'order-status',
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch {
          // In some iframe environments native Notifications might be restricted
        }
      }
    }
  }

  public subscribe(listener: PushListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const pushNotifications = new PushNotificationService();
