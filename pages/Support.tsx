import React, { useState } from 'react';
import { Heart, Coffee, CreditCard, Gift, ArrowRight, Share2, Star, Sparkles, X, Copy, Send, MessageSquare } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { TRANSLATIONS } from '../constants';
import { toast } from 'react-hot-toast';
import { SEO } from '../components/SEO';
import { AvatarPicker } from '../components/AvatarPicker';
import { useAuth } from '../context/AuthContext';

interface SupportProps {
    lang?: string;
}

const Support: React.FC<SupportProps> = ({ lang: propLang }) => {
    const { lang: urlLang } = useParams<{ lang: string }>();
    const lang = propLang || urlLang || 'ar';
    const isRTL = lang === 'ar';
    const tNav = TRANSLATIONS[lang as keyof typeof TRANSLATIONS]?.nav || TRANSLATIONS.ar.nav;
    const tSupport = (TRANSLATIONS[lang as keyof typeof TRANSLATIONS] as any)?.support || TRANSLATIONS.ar.support;

    const { isAuthenticated, user } = useAuth();
    const [settings, setSettings] = React.useState<Record<string, string>>({});
    const [showShareModal, setShowShareModal] = React.useState(false);
    
    // Review Form State
    const [showReviewForm, setShowReviewForm] = React.useState(false);
    const [reviewRating, setReviewRating] = React.useState(5);
    const [reviewComment, setReviewComment] = React.useState('');
    const [guestName, setGuestName] = React.useState('');
    const [guestAvatar, setGuestAvatar] = React.useState('avatar-1');
    const [submittingReview, setSubmittingReview] = React.useState(false);

    React.useEffect(() => {
        api.get('/settings').then(res => {
            const map: Record<string, string> = {};
            res.data.forEach((s: any) => map[s.key] = s.value);
            setSettings(map);
        }).catch(err => console.error('Error fetching settings:', err));
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(isRTL ? 'تم نسخ الرابط!' : 'Link copied!');
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            toast.error(isRTL ? 'الرجاء كتابة مراجعتك' : 'Please write your review');
            return;
        }
        
        if (!isAuthenticated && !guestName.trim()) {
            toast.error(isRTL ? 'الرجاء إدخال اسمك' : 'Please enter your name');
            return;
        }

        setSubmittingReview(true);
        try {
            await api.post('/reviews', {
                type: 'platform',
                rating: reviewRating,
                comment: reviewComment.trim(),
                guestName: !isAuthenticated ? guestName.trim() : undefined,
                guestAvatar: !isAuthenticated ? guestAvatar : undefined
            });
            toast.success(isRTL ? '🎉 شكراً لك على مشاركتنا تجربتك الرائعة!' : '🎉 Thank you for sharing your wonderful experience!');
            setReviewComment('');
            setReviewRating(5);
            setGuestName('');
            setShowReviewForm(false);
        } catch (error) {
            toast.error(isRTL ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const supportMethods = [
        {
            id: 'coffee',
            icon: <Coffee size={32} />,
            title: tSupport.methodCoffee,
            desc: tSupport.methodCoffeeDesc,
            link: settings.buymeacoffee_url || 'https://buymeacoffee.com/jeenarabi',
            color: 'bg-yellow-500',
            buttonText: tSupport.methodCoffeeBtn
        },
        {
            id: 'paypal',
            icon: <CreditCard size={32} />,
            title: tSupport.methodPaypal,
            desc: tSupport.methodPaypalDesc,
            link: settings.paypal_url || 'https://paypal.me/jeenarabi',
            color: 'bg-blue-600',
            buttonText: tSupport.methodPaypalBtn
        },
        {
            id: 'share',
            icon: <Share2 size={32} />,
            title: tSupport.methodShare,
            desc: tSupport.methodShareDesc,
            link: '#',
            color: 'bg-purple-600',
            buttonText: tSupport.methodShareBtn,
            action: () => setShowShareModal(true)
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-dark-bg transition-colors duration-500 pt-24 pb-20">
            <SEO
                title={tSupport.title}
                description={(TRANSLATIONS[lang as keyof typeof TRANSLATIONS] as any).seo.support.description}
                keywords={(TRANSLATIONS[lang as keyof typeof TRANSLATIONS] as any).seo.support.keywords}
                lang={lang as any}
            />
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6">
                        <Heart className="text-primary animate-pulse" size={40} fill="currentColor" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                        {tSupport.parentTitle}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        {tSupport.parentSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {supportMethods.map((method, idx) => (
                        <div
                            key={method.id}
                            className="bg-white dark:bg-dark-card rounded-[32px] p-8 shadow-xl border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group animate-slide-up"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className={`${method.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:rotate-12 transition-transform`}>
                                {method.icon}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{method.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">{method.desc}</p>
                            <a
                                href={method.link}
                                onClick={(e) => {
                                    if (method.action) {
                                        e.preventDefault();
                                        method.action();
                                    }
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 font-bold text-primary group-hover:gap-3 transition-all"
                            >
                                {method.buttonText}
                                <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                            </a>
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 md:p-16 text-white text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <Sparkles className="absolute top-10 left-10 animate-pulse" size={100} />
                        <Star className="absolute bottom-10 right-10 animate-bounce" size={80} />
                    </div>

                    <h2 className="text-3xl font-black mb-6 relative z-10">{tSupport.impactTitle}</h2>
                    <p className="text-xl text-white/80 leading-relaxed mb-10 relative z-10">
                        {tSupport.impactDesc}
                    </p>

                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-bold text-lg">
                        <Gift size={24} />
                        {tSupport.footerMsg}
                    </div>
                </div>

                {/* Write a Review Section */}
                <div className="mt-20 bg-white dark:bg-dark-card rounded-[40px] p-10 md:p-16 shadow-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                            <MessageSquare className="text-primary" size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                            {isRTL ? 'شاركنا رأيك' : 'Share Your Feedback'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                            {isRTL 
                                ? 'رأيك يهمنا! ساعدنا على تحسين تجربة جين عربي للجميع'
                                : 'Your opinion matters! Help us improve Jeen Arabi for everyone'
                            }
                        </p>
                    </div>

                    {!showReviewForm ? (
                        <div className="text-center space-y-4">
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Star size={24} fill="currentColor" />
                                {isRTL ? 'اكتب مراجعة' : 'Write a Review'}
                            </button>
                            <div>
                                <Link 
                                    to="/#testimonials" 
                                    className="inline-flex items-center gap-2 text-primary hover:underline font-bold"
                                >
                                    {isRTL ? 'عرض جميع الآراء' : 'View All Reviews'}
                                    <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {/* Guest Name & Avatar (if not authenticated) */}
                            {!isAuthenticated && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder={isRTL ? 'اسمك' : 'Your Name'}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white font-bold focus:border-primary focus:outline-none transition-colors"
                                    />
                                    <AvatarPicker 
                                        selected={guestAvatar} 
                                        onSelect={setGuestAvatar} 
                                        lang={lang as any}
                                    />
                                </div>
                            )}

                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                    {isRTL ? 'التقييم' : 'Rating'}
                                </label>
                                <div className="flex gap-2 justify-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="transition-transform hover:scale-125 active:scale-110"
                                        >
                                            <Star 
                                                size={40} 
                                                className={star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}
                                                fill={star <= reviewRating ? 'currentColor' : 'none'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                    {isRTL ? 'مراجعتك' : 'Your Review'}
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder={isRTL ? 'شاركنا تجربتك مع جين عربي...' : 'Share your experience with Jeen Arabi...'}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white font-medium focus:border-primary focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowReviewForm(false)}
                                    className="px-6 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingReview ? (
                                        isRTL ? 'جاري الإرسال...' : 'Submitting...'
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            {isRTL ? 'إرسال' : 'Submit'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Magical Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowShareModal(false)}>
                    <div
                        className="bg-white dark:bg-dark-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative h-32 bg-gradient-to-br from-primary via-purple-600 to-indigo-600 flex items-center justify-center">
                            <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                                <button onClick={() => setShowShareModal(false)} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/30 shadow-xl">
                                <Share2 size={40} className="text-white" />
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 text-center">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                                {isRTL ? 'شارك السحر مع الأصدقاء' : 'Share the Magic'}
                            </h3>

                            {/* QR Code Container */}
                            <div className="relative bg-white p-4 rounded-3xl inline-block shadow-inner border border-gray-100 mb-8 mx-auto group/qr">
                                <div className="relative">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}&bgcolor=ffffff&color=6366f1&margin=10&qzone=1&ecc=H`}
                                        alt="QR Code"
                                        className="w-48 h-48 object-contain mx-auto transition-transform group-hover/qr:scale-105 duration-500"
                                    />
                                    {/* Logo Overlay - Optimized for scannability */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-11 h-11 bg-white rounded-xl p-1 shadow-lg border border-indigo-50 flex items-center justify-center">
                                            <img
                                                src="/logo-mascot.png"
                                                alt="Logo"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    // Fallback to Icon if image doesn't exist
                                                    (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3593/3593456.png";
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{isRTL ? 'امسح لزيارة الموقع' : 'Scan to visit'}</p>
                            </div>

                            {/* Link Container */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <span className="flex-1 text-sm font-medium text-gray-500 truncate">{window.location.origin}</span>
                                    <button
                                        onClick={() => copyToClipboard(window.location.origin)}
                                        className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                                        title={isRTL ? 'نسخ الرابط' : 'Copy Link'}
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Jeen Arabi - جين عربي',
                                                text: isRTL ? 'اكتشف عالماً من القصص السحرية للأطفال على جين عربي!' : 'Discover a world of magical stories for children on Jeen Arabi!',
                                                url: window.location.origin
                                            });
                                        } else {
                                            copyToClipboard(window.location.origin);
                                        }
                                    }}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={20} />
                                    {isRTL ? 'مشاركة عبر التطبيقات' : 'Share via Apps'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
