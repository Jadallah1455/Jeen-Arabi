import React, { useState, useEffect } from 'react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Globe, Monitor, Smartphone, TrendingUp, Users, Eye, Share2, Calendar, RefreshCw, Download } from 'lucide-react';
import * as analyticsService from '../services/analyticsService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export const AnalyticsDashboard: React.FC<{ lang: string }> = ({ lang }) => {
    const isRTL = lang === 'ar';
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    const [visitorStats, setVisitorStats] = useState<any>(null);
    const [geoData, setGeoData] = useState<any>(null);
    const [deviceData, setDeviceData] = useState<any>(null);
    const [trafficData, setTrafficData] = useState<any>(null);
    const [topStories, setTopStories] = useState<any>(null);
    const [socialStats, setSocialStats] = useState<any>(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const { start, end } = dateRange;
            const [stats, geo, devices, traffic, stories, social] = await Promise.all([
                analyticsService.getVisitorStats(start, end),
                analyticsService.getGeographicDistribution(start, end),
                analyticsService.getDeviceBreakdown(start, end),
                analyticsService.getTrafficSources(start, end),
                analyticsService.getTopStories(start, end, 10),
                analyticsService.getSocialMediaStats(start, end)
            ]);

            setVisitorStats(stats);
            setGeoData(geo);
            setDeviceData(devices);
            setTrafficData(traffic);
            setTopStories(stories);
            setSocialStats(social);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Set default date range (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    }, []);

    useEffect(() => {
        if (dateRange.start && dateRange.end) {
            fetchAllData();
        }
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Range */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    {lang === 'ar' ? 'لوحة التحليلات' : lang === 'fr' ? 'Tableau de Bord Analytique' : 'Analytics Dashboard'}
                </h2>
                <div className="flex gap-4">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-600"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-600"
                    />
                    <button onClick={fetchAllData} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-bold">{lang === 'ar' ? 'زوار فريدون' : 'Unique Visitors'}</p>
                            <p className="text-3xl font-black mt-2">{visitorStats?.summary?.uniqueVisitors?.toLocaleString()}</p>
                        </div>
                        <Users size={40} className="opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-bold">{lang === 'ar' ? 'مشاهدات الصفحات' : 'Page Views'}</p>
                            <p className="text-3xl font-black mt-2">{visitorStats?.summary?.totalPageViews?.toLocaleString()}</p>
                        </div>
                        <Eye size={40} className="opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-bold">{lang === 'ar' ? 'مستخدمون مسجلون' : 'Registered Users'}</p>
                            <p className="text-3xl font-black mt-2">{visitorStats?.summary?.registeredVisitors?.toLocaleString()}</p>
                        </div>
                        <TrendingUp size={40} className="opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-sm font-bold">{lang === 'ar' ? 'متوسط الصفحات / جلسة' : 'Avg. Pages/Session'}</p>
                            <p className="text-3xl font-black mt-2">{visitorStats?.summary?.avgPagesPerSession?.toFixed(1)}</p>
                        </div>
                        <Calendar size={40} className="opacity-50" />
                    </div>
                </div>
            </div>

            {/* Daily Growth Chart */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white">
                    {lang === 'ar' ? 'النمو اليومي' : 'Daily Growth'}
                </h3>
                <ResponsiveContainer width="100%" height={300} minHeight={300}>
                    <AreaChart data={visitorStats?.dailyGrowth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="visitors" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name={lang === 'ar' ? 'الزوار' : 'Visitors'} />
                        <Area type="monotone" dataKey="pageViews" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name={lang === 'ar' ? 'المشاهدات' : 'Page Views'} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Breakdown */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <Monitor size={24} className="text-primary" />
                        {lang === 'ar' ? 'توزيع الأجهزة' : 'Device Breakdown'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250} minHeight={250}>
                        <RePieChart>
                            <Pie
                                data={deviceData?.devices || []}
                                dataKey="count"
                                nameKey="device"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {(deviceData?.devices || []).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Browsers */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'أشهر المتصفحات' : 'Top Browsers'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250} minHeight={250}>
                        <ReBarChart data={deviceData?.browsers || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="browser" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" />
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe size={24} className="text-primary" />
                    {lang === 'ar' ? 'التوزيع الجغرافي' : 'Geographic Distribution'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold mb-3">{lang === 'ar' ? 'أفضل الدول' : 'Top Countries'}</h4>
                        <div className="space-y-2">
                            {(geoData?.countries || []).slice(0, 10).map((country: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="font-bold">{country.countryName || country.country}</span>
                                    <span className="text-primary font-black">{country.visitors}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">{lang === 'ar' ? 'أفضل المدن' : 'Top Cities'}</h4>
                        <div className="space-y-2">
                            {(geoData?.cities || []).slice(0, 10).map((city: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="font-bold">{city.city}, {city.country}</span>
                                    <span className="text-primary font-black">{city.visitors}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Share2 size={24} className="text-primary" />
                    {lang === 'ar' ? 'مصادر الزيارات' : 'Traffic Sources'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold mb-3">{lang === 'ar' ? 'حملات UTM' : 'UTM Campaigns'}</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="text-left px-2 py-2 text-sm">{lang === 'ar' ? 'المصدر' : 'Source'}</th>
                                        <th className="text-left px-2 py-2 text-sm">{lang === 'ar' ? 'الوسيط' : 'Medium'}</th>
                                        <th className="text-right px-2 py-2 text-sm">{lang === 'ar' ? 'الزوار' : 'Visitors'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(trafficData?.utmSources || []).slice(0, 10).map((source: any, idx: number) => (
                                        <tr key={idx} className="border-b dark:border-gray-700">
                                            <td className="px-2 py-2 font-bold">{source.utmSource}</td>
                                            <td className="px-2 py-2">{source.utmMedium}</td>
                                            <td className="px-2 py-2 text-right font-black text-primary">{source.visitors}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">{lang === 'ar' ? 'الإحالات' : 'Referrals'}</h4>
                        <div className="space-y-2">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'زيارات مباشرة' : 'Direct Traffic'}</p>
                                <p className="text-2xl font-black text-green-600 dark:text-green-400">{trafficData?.directTraffic || 0}</p>
                            </div>
                            {(trafficData?.referrals || []).slice(0, 5).map((ref: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm truncate">{ref.referrer}</span>
                                    <span className="text-primary font-black">{ref.visitors}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Stories */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white">
                    {lang === 'ar' ? 'أكثر القصص مشاهدة' : 'Top Performing Stories'}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="text-left px-4 py-3">{lang === 'ar' ? 'القصة' : 'Story'}</th>
                                <th className="text-right px-4 py-3">{lang === 'ar' ? 'زوار فريدون' : 'Unique Views'}</th>
                                <th className="text-right px-4 py-3">{lang === 'ar' ? 'المشاهدات الكلية' : 'Total Views'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(topStories || []).map((story: any, idx: number) => (
                                <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={story.Story?.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            <span className="font-bold">{story.Story?.title?.[lang] || story.Story?.title?.en}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-primary">{story.uniqueViews}</td>
                                    <td className="px-4 py-3 text-right">{story.totalViews}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Social Media Performance */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Share2 size={24} className="text-primary" />
                    {lang === 'ar' ? 'أداء السوشال ميديا' : 'Social Media Performance'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={250} minHeight={250}>
                        <ReBarChart data={socialStats?.platforms || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="platform" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalClicks" fill="#8b5cf6" name={lang === 'ar' ? 'النقرات' : 'Clicks'} />
                            <Bar dataKey="totalConversions" fill="#6366f1" name={lang === 'ar' ? 'التحويلات' : 'Conversions'} />
                        </ReBarChart>
                    </ResponsiveContainer>
                    <div>
                        <h4 className="font-bold mb-3">{lang === 'ar' ? 'أكثر القصص مشاركة' : 'Most Shared Stories'}</h4>
                        <div className="space-y-2">
                            {(socialStats?.topSharedStories || []).slice(0, 5).map((story: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="font-bold truncate">{story.Story?.title?.[lang] || story.Story?.title?.en}</span>
                                    <span className="text-primary font-black">{story.totalConversions}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
