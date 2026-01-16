import React, { useState, useEffect } from 'react';
import { Bell, X, BookOpen, Star, Info, Check } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Notification {
    id: number;
    titleAr: string;
    titleEn: string;
    titleFr: string;
    messageAr: string;
    messageEn: string;
    messageFr: string;
    type: 'info' | 'success' | 'warning' | 'story' | 'review';
    isRead: boolean;
    targetId?: string;
    targetType?: 'story' | 'review' | 'system';
    actionUrl?: string;
    createdAt: string;
}

interface NotificationPanelProps {
    lang: 'ar' | 'en' | 'fr';
    onStoryClick?: (storyId: string) => void; // Callback to open story modal
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ lang, onStoryClick }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const isRTL = lang === 'ar';

    const t = {
        ar: {
            notifications: 'الإشعارات',
            markAllRead: 'تعيين الكل كمقروء',
            noNotifications: 'لا توجد إشعارات',
            newStory: 'قصة جديدة',
            clickToView: 'اضغط للعرض'
        },
        en: {
            notifications: 'Notifications',
            markAllRead: 'Mark All as Read',
            noNotifications: 'No notifications',
            newStory: 'New Story',
            clickToView: 'Click to view'
        },
        fr: {
            notifications: 'Notifications',
            markAllRead: 'Tout marquer comme lu',
            noNotifications: 'Aucune notification',
            newStory: 'Nouvelle histoire',
            clickToView: 'Cliquez pour voir'
        }
    };

    const texts = t[lang];

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        try {
            await api.patch(`/notifications/${notification.id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }

        // Handle action based on type
        if (notification.targetType === 'story' && notification.targetId) {
            setIsOpen(false);
            if (onStoryClick) {
                onStoryClick(notification.targetId);
            } else {
                // Fallback: navigate to library with story ID in URL
                navigate(`/library?story=${notification.targetId}`);
            }
        } else if (notification.actionUrl) {
            setIsOpen(false);
            navigate(notification.actionUrl);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success(isRTL ? 'تم تعيين الكل كمقروء' : 'All marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'story': return <BookOpen size={20} className="text-primary" />;
            case 'review': return <Star size={20} className="text-yellow-500" />;
            case 'success': return <Check size={20} className="text-green-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const getTitle = (notification: Notification) => {
        if (lang === 'ar') return notification.titleAr;
        if (lang === 'fr') return notification.titleFr;
        return notification.titleEn;
    };

    const getMessage = (notification: Notification) => {
        if (lang === 'ar') return notification.messageAr;
        if (lang === 'fr') return notification.messageFr;
        return notification.messageEn;
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                title={texts.notifications}
            >
                <Bell size={24} className="text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 md:w-96 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-slide-up overflow-hidden`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-black dark:text-white">{texts.notifications}</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline font-bold"
                                    >
                                        {texts.markAllRead}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>{texts.noNotifications}</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                            !notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-sm dark:text-white">
                                                        {getTitle(notification)}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {getMessage(notification)}
                                                </p>
                                                {notification.targetType === 'story' && (
                                                    <p className="text-xs text-primary font-bold mt-1">
                                                        {texts.clickToView}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(notification.createdAt).toLocaleDateString(lang, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
