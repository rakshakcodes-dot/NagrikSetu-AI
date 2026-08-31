import React, { useState, useEffect } from 'react';
import { AppNotification, PageView } from '../types';
import { subscribeToToastAlerts } from '../services/notificationService';
import { Bell, CloudRain, AlertTriangle, CheckCircle2, HardHat, X } from 'lucide-react';

interface NotificationToastProps {
  onNavigateToComplaint?: (complaintId: string) => void;
  onNavigateToPage?: (page: PageView) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  onNavigateToComplaint,
  onNavigateToPage,
}) => {
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToToastAlerts((notification) => {
      setActiveToast(notification);

      // Auto-hide after 5.5 seconds
      const timer = setTimeout(() => {
        setActiveToast((current) => (current?.id === notification.id ? null : current));
      }, 5500);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!activeToast) return null;

  const handleClick = () => {
    if (activeToast.complaintId && onNavigateToComplaint) {
      onNavigateToComplaint(activeToast.complaintId);
    } else if (activeToast.actionPage && onNavigateToPage) {
      onNavigateToPage(activeToast.actionPage);
    }
    setActiveToast(null);
  };

  const getIcon = () => {
    if (activeToast.type === 'monsoon_advisory' || activeToast.type === 'weather_alert') {
      return <CloudRain className="w-5 h-5 text-sky-500" />;
    }
    if (activeToast.type === 'high_priority_alert' || activeToast.priority === 'urgent') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (activeToast.type === 'complaint_resolved') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    if (activeToast.type === 'complaint_assigned' || activeToast.type === 'complaint_status') {
      return <HardHat className="w-5 h-5 text-blue-500" />;
    }
    return <Bell className="w-5 h-5 text-violet-500" />;
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 animate-in slide-in-from-bottom-5 duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-800 rounded-lg shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Live Civic Alert
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <h4 className="text-xs font-bold text-slate-100 line-clamp-1 mt-0.5">
            {activeToast.title}
          </h4>
          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
            {activeToast.message}
          </p>
        </div>
      </div>
    </div>
  );
};
