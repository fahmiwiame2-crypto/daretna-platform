import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { db } from '../services/db';

interface NotificationCenterProps {
    userId: string;
    onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const loadNotifications = () => {
        const notifs = db.getNotifications(userId);
        setNotifications(notifs);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'PAYMENT': return '💰';
            case 'ALERT': return '⚠️';
            case 'INFO': return 'ℹ️';
            case 'SUCCESS': return '✅';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'PAYMENT': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
            case 'ALERT': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
            case 'INFO': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
            case 'SUCCESS': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
            default: return 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slideDown">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                            <span>🔔</span> Notifications
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                                    ? 'bg-daretPink text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            Toutes ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'unread'
                                    ? 'bg-daretPink text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            Non lues ({notifications.filter(n => !n.read).length})
                        </button>
                        {notifications.some(n => !n.read) && (
                            <button
                                onClick={markAllAsRead}
                                className="ml-auto text-sm text-daretPink hover:text-pink-700 font-medium"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-slate-500 dark:text-slate-400">
                                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getNotificationColor(notif.type)
                                    } ${!notif.read ? 'border-l-4 border-l-daretPink' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-navy-900 dark:text-white font-medium mb-1">
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(notif.date).toLocaleString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!notif.read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                title="Marquer comme lu"
                                            >
                                                ✓
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                            title="Supprimer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};
