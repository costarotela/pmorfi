import React, { useEffect, useState } from 'react';
import { pushNotifications, PushAlert } from '../services/pushNotifications';
import { Bell, CheckCircle2, Flame, Bike, AlertCircle, X } from 'lucide-react';

interface ToastAlertProps {
  onOpenOrder?: (orderId: string) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ onOpenOrder }) => {
  const [alerts, setAlerts] = useState<PushAlert[]>([]);

  useEffect(() => {
    const unsubscribe = pushNotifications.subscribe((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 3)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => {
        let Icon = Bell;
        let iconBg = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

        if (alert.title.includes('Cocina') || alert.title.includes('Preparación')) {
          Icon = Flame;
          iconBg = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        } else if (alert.title.includes('Camino') || alert.title.includes('Repartidor')) {
          Icon = Bike;
          iconBg = 'bg-sky-500/20 text-sky-400 border-sky-500/30';
        } else if (alert.title.includes('Entregado') || alert.title.includes('Confirmado')) {
          Icon = CheckCircle2;
          iconBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        } else if (alert.title.includes('Cancelado')) {
          Icon = AlertCircle;
          iconBg = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        }

        return (
          <div
            key={alert.id}
            className="pointer-events-auto bg-stone-900/95 border border-stone-700/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl shadow-black/60 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 duration-300"
          >
            <div className={`p-2.5 rounded-xl border ${iconBg} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-stone-100 flex items-center justify-between">
                <span>{alert.title}</span>
                <span className="text-[10px] text-stone-400 font-normal">Ahora</span>
              </h4>
              <p className="text-xs text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">{alert.body}</p>
              {alert.orderId && onOpenOrder && (
                <button
                  onClick={() => onOpenOrder(alert.orderId!)}
                  className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                >
                  Ver seguimiento &rarr;
                </button>
              )}
            </div>
            <button
              onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              className="text-stone-400 hover:text-stone-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
