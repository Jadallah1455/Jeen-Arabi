import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAvatarData } from '../constants/avatars';
import { Globe, Menu, X, LogOut, Moon, Sun, BookOpen, Sparkles, Book, User, Bell, Heart, Trophy } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface NavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, setLang, isDark, toggleTheme }) => {
  const t = TRANSLATIONS[lang].nav;
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  React.useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [isAuthenticated]);

  // Click outside to close notifications
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.delete(`/users/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      if (err.response?.status === 404) {
        // If it's already gone on server, just remove it from UI
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        console.error('Error deleting notification:', err);
      }
    }
  };

  const handleNotificationClick = (notification: any) => {
    markRead(notification.id);
    if (notification.targetType === 'story' && notification.targetId) {
      navigate('/library', {
        state: {
          openStoryId: notification.targetId,
          _t: Date.now()
        }
      });
    }
    setShowNotifications(false);
  };

  const cycleLang = () => {
    if (lang === 'ar') setLang('en');
    else if (lang === 'en') setLang('fr');
    else setLang('ar');
  };

  const navLinks = [
    { path: '/library', label: t.library },
    { path: '/design', label: t.design },
    { path: '/support', label: t.support, isSupport: true },
  ];

  if (isAuthenticated && isAdmin) {
    navLinks.push({ path: '/admin', label: t.adminPanel });
  }

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const NotificationDropdown = () => (
    <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-slide-up">
      <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
        <h3 className="font-bold flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          {lang === 'ar' ? 'الإشعارات' : (lang === 'fr' ? 'Notifications' : 'Notifications')}
        </h3>
        {unreadCount > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} {lang === 'ar' ? 'جديد' : (lang === 'fr' ? 'nouveau' : 'new')}</span>}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {lang === 'ar' ? 'لا يوجد إشعارات حالياً' : (lang === 'fr' ? 'Pas de notifications' : 'No notifications yet')}
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative group/item ${!n.isRead ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-sm mb-1 pr-6 leading-tight">
                  {(lang === 'ar' ? n.titleAr : (lang === 'fr' ? n.titleFr : n.titleEn)) || n.titleAr || n.titleEn || 'Notification'}
                </h4>
                <button
                  onClick={(e) => deleteNotification(e, n.id)}
                  className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {(lang === 'ar' ? n.messageAr : (lang === 'fr' ? n.messageFr : n.messageEn)) || n.messageAr || n.messageEn}
              </p>

              {n.targetType === 'story' && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                  <div className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg transition-all hover:bg-primary/10">
                    <BookOpen size={12} />
                    {TRANSLATIONS[lang].library.read}
                  </div>
                </div>
              )}
              {n.targetType !== 'story' && (
                <span className="text-[10px] text-gray-400 mt-2 block">
                  {new Date(n.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <nav className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative w-11 h-11 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/30 transform group-hover:rotate-6 transition-all duration-300">
                <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                <Book size={22} className="text-white relative z-10" strokeWidth={2.5} />
                <Sparkles size={16} className="absolute -top-2 -right-2 text-yellow-400 drop-shadow-md animate-pulse z-20" fill="currentColor" />
              </div>

              <div className="flex flex-col justify-center">
                <span className={`text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300`}>
                  {lang === 'ar' ? 'جين عربي' : 'Jeen Arabi'}
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center md:space-x-2 lg:space-x-6 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-lg font-medium transition-colors group ${isActive(link.path)
                  ? 'text-primary dark:text-primary'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                  }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            ))}

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

            <button onClick={toggleTheme} className="relative p-2 w-10 h-10 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-500 overflow-hidden group">
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isDark ? 'rotate-[360deg] scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
                <Moon size={20} className="text-indigo-500" />
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-[-360deg] scale-0 opacity-0'}`}>
                <Sun size={20} className="text-yellow-400" />
              </div>
            </button>

            <button onClick={cycleLang} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-all text-sm font-bold group">
              <Globe size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="uppercase">{lang}</span>
            </button>

            {isAuthenticated && (
              <div className="relative notification-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 hover:text-primary transition-all relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-2">
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-primary/10 hover:text-primary transition-all overflow-hidden"
                  title={t.myDashboard}
                >
                  {user?.avatar ? (
                    <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: getAvatarData(user.avatar).color }}
                    >
                        {getAvatarData(user.avatar).emoji}
                    </div>
                  ) : (
                    <div className="p-1">
                        <User size={20} />
                    </div>
                  )}
                </Link>
                {user?.points !== undefined && (
                  <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30 animate-in fade-in slide-in-from-top-2 duration-500`} title="Points">
                    <Trophy size={16} className="text-yellow-500" />
                    <span>{user.points}</span>
                  </div>
                )}
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title={t.logout}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:-translate-y-0.5">
                {t.signIn}
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            {isAuthenticated && (
              <div className="relative notification-container">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setIsOpen(false);
                  }}
                  className="p-2 text-gray-500 hover:text-primary transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-300">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300">{isOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 animate-slide-up shadow-lg absolute w-full p-4 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-bold ${isActive(link.path) ? 'text-primary bg-primary/10' : 'text-gray-600 dark:text-gray-300'} ${lang === 'ar' ? 'text-right' : ''}`}>{link.label}</Link>
          ))}
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>
          <div className="flex justify-around mb-4">
            {['en', 'ar', 'fr'].map(l => (
              <button key={l} onClick={() => setLang(l as Language)} className={`px-4 py-2 rounded-lg text-xs font-bold ${lang === l ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{l.toUpperCase()}</button>
            ))}
          </div>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="w-full text-right px-4 py-3 font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">{t.logout}</button>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-3 font-bold text-white bg-primary rounded-xl">{t.signIn}</Link>
          )}
        </div>
      )}
    </nav>
  );
};