import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAvatarData } from '../constants/avatars';
import { SEO } from '../components/SEO';
import dailyTipsData from '../data/dailyTips.json';
import {
    Heart,
    BookOpen,
    Sparkles,
    Settings,
    LogOut,
    Clock,
    ChevronRight,
    Rocket,
    Star,
    Trophy,
    User as UserIcon
} from 'lucide-react';

interface DashboardProps {
    lang: Language;
}

export const UserDashboard: React.FC<DashboardProps> = ({ lang }) => {
    const t = TRANSLATIONS[lang].dashboard;
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isRTL = lang === 'ar';

    const [favorites, setFavorites] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [designs, setDesigns] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [favsRes, historyRes, designsRes, recsRes] = await Promise.all([
                    api.get('/favorites'),
                    api.get('/users/history'),
                    api.get('/users/designs'),
                    api.get('/stories/recommendations')
                ]);
                setFavorites(favsRes.data);
                setHistory(historyRes.data);
                setDesigns(designsRes.data);
                setRecommendations(recsRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const stats = React.useMemo(() => {
        const totalSeconds = history.reduce((acc, h) => acc + (h.UserStory.totalReadingTime || 0), 0);
        const completedCount = history.filter(h => h.UserStory.isCompleted).length;
        const lastIncomplete = history.find(h => !h.UserStory.isCompleted && (h.UserStory.lastPageReached || 0) > 0);

        return {
            minutes: Math.round(totalSeconds / 60),
            completed: completedCount,
            resume: lastIncomplete
        };
    }, [history]);

    // Daily Tip: rotates based on day of year
    const dailyTip = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const tipIndex = dayOfYear % dailyTipsData.tips.length;
        return dailyTipsData.tips[tipIndex][lang] || dailyTipsData.tips[tipIndex].ar;
    }, [lang]);

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-screen bg-gray-50/50 dark:bg-dark-bg transition-colors duration-500 pb-12"
        >
            <SEO
                title={t.title}
                lang={lang}
            />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-purple-700 pt-32 pb-20 px-4">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-xl rounded-[40px] flex items-center justify-center border-2 border-white/30 shadow-2xl shrink-0 overflow-hidden">
                            {user?.avatar ? (
                                <div 
                                    className="w-full h-full flex items-center justify-center text-4xl md:text-6xl"
                                    style={{ backgroundColor: getAvatarData(user.avatar).color }}
                                >
                                    {getAvatarData(user.avatar).emoji}
                                </div>
                            ) : (
                                <UserIcon size={window.innerWidth < 768 ? 48 : 64} className="text-white" />
                            )}
                        </div>

                        <div className="text-center md:text-left rtl:md:text-right flex-1">
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                                {t.welcome.replace('{name}', user?.username || t.friend)}
                            </h1>
                            <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl">
                                {t.subtitle}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleLogout} className="p-4 bg-white/10 hover:bg-red-500/20 text-white rounded-2xl backdrop-blur-md border border-white/20 transition-all group" title={TRANSLATIONS[lang].nav.logout}>
                                <LogOut size={24} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Board */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/library" className="group bg-white dark:bg-dark-card p-6 md:p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 hover:shadow-primary/20 transition-all flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BookOpen size={32} />
                                </div>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{t.quickLibrary}</span>
                            </Link>
                            <Link to="/design" className="group bg-white dark:bg-dark-card p-6 md:p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 hover:shadow-purple-500/20 transition-all flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Sparkles size={32} />
                                </div>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{t.quickDesign}</span>
                            </Link>
                        </div>

                        {/* Resume Reading Section */}
                        {stats.resume && (
                            <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-[32px] p-8 text-white shadow-2xl animate-slide-up relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-32 h-44 rounded-2xl overflow-hidden shadow-2xl shrink-0 rotate-[-2deg] group-hover:rotate-0 transition-transform">
                                        <img 
                                            src={stats.resume.coverImage} 
                                            alt={`${stats.resume.title[lang] || stats.resume.title.ar || stats.resume.title.en || stats.resume.title.fr} ${isRTL ? 'غلاف' : 'cover'}`}
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left rtl:md:text-right">
                                        <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold mb-4">{t.continueReading}</span>
                                        <h3 className="text-3xl font-black mb-4">{stats.resume.title[lang] || stats.resume.title.ar || stats.resume.title.en || stats.resume.title.fr}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Clock size={18} />
                                                <span className="font-bold">{t.page} {stats.resume.UserStory.lastPageReached + 1}</span>
                                            </div>
                                        </div>
                                        <Link to={`/library/${stats.resume.id}`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl">
                                            {t.startNow}
                                            <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Favorites Section */}
                        <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg"><Heart size={20} fill="currentColor" /></div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.myFavorites}</h2>
                                </div>
                                <span className="text-sm font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">{favorites.length}</span>
                            </div>

                            <div className="p-8">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    </div>
                                ) : favorites.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Rocket size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                                            {t.noFavorites}
                                        </p>
                                        <Link to="/library" className="mt-4 inline-block text-primary font-bold hover:underline">{t.goToLibrary}</Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {favorites.slice(0, 3).map((story) => (
                                            <Link key={story.id} to={`/library/${story.id}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 transition-all">
                                                <img src={story.coverImage} alt={story.title[lang] || story.title.ar || story.title.en} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    <h4 className="text-white font-bold text-sm line-clamp-2">{story.title[lang] || story.title.ar || story.title.en || story.title.fr}</h4>
                                                </div>
                                            </Link>
                                        ))}
                                        {favorites.length > 3 && (
                                            <Link
                                                to="/library"
                                                state={{ showFavs: true }}
                                                className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">{t.viewInLibrary}</span>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>


                        {/* Recommended For You */}
                        <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-lg"><Sparkles size={20} fill="currentColor" /></div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{lang === 'ar' ? 'قصص مختارة لك' : (lang === 'fr' ? 'Recommandé pour vous' : 'Recommended for You')}</h2>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                {recommendations.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                         {loading ? '...' : (lang === 'ar' ? 'ابدأ القراءة لنقترح عليك قصصاً مميزة!' : 'Start reading to get recommendations!')}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {recommendations.map((story) => (
                                            <Link key={story.id} to={`/library/${story.id}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 transition-all">
                                                <img src={story.coverImage} alt={story.title[lang] || story.title.ar || story.title.en} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    <div className="flex gap-2 mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-white bg-primary/80 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                            {lang === 'ar' ? 'مقترح لك' : 'Pick'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm line-clamp-2">{story.title[lang] || story.title.ar || story.title.en || story.title.fr}</h4>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Stats Card */}
                        <div className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <Star size={20} className="text-yellow-400" fill="currentColor" />
                                {t.stats}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    <span className="text-gray-500 font-bold">{t.readingMinutes}</span>
                                    <span className="text-xl font-black text-indigo-500">{stats.minutes}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    <span className="text-gray-500 font-bold">{t.completedStories}</span>
                                    <span className="text-xl font-black text-green-500">{stats.completed}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    <span className="text-gray-500 font-bold">{t.myDesigns}</span>
                                    <span className="text-xl font-black text-purple-500">{designs.length}</span>
                                </div>
                            </div>

                        {/* Level & Points Card */}
                        <div className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800">
                             <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" fill="currentColor" />
                                {lang === 'ar' ? 'نقاطي ومستواي' : (lang === 'fr' ? 'Mes Points' : 'My Points & Level')}
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">{lang === 'ar' ? 'النقاط الحالية' : 'Current Points'}</span>
                                        <span className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{user?.points || 0}</span>
                                    </div>
                                    <Trophy size={40} className="text-yellow-500 opacity-80" />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-gray-500">{lang === 'ar' ? 'المستوى' : 'Level'} {user?.level || 1}</span>
                                        <span className="text-primary">{(user?.points || 0) % 1000} / 1000</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(((user?.points || 0) % 1000) / 10, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        {lang === 'ar' ? 'اجمع 1000 نقطة للانتقال للمستوى التالي!' : 'Collect 1000 points to reach next level!'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* Reading Tip */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[32px] shadow-xl text-white relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                                <BookOpen size={120} />
                            </div>
                            <h3 className="text-xl font-black mb-2 relative z-10">💡 {lang === 'ar' ? 'نصيحة اليوم' : (lang === 'fr' ? 'Conseil du jour' : 'Tip of the Day')}</h3>
                            <p className="text-white/80 font-medium relative z-10 leading-relaxed">
                                {dailyTip}
                            </p>
                        </div>

                        {/* Account Management Link */}
                        <Link to="/settings" className="w-full flex items-center justify-between p-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <Settings size={20} />
                                <span>{t.settings}</span>
                            </div>
                            <ChevronRight size={18} className={isRTL ? 'rotate-180' : ''} />
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};
