import React from 'react';
import { Shield, FileText, ArrowLeft, Sparkles, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LegalPageProps {
    lang: Language;
    type: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ lang, type }) => {
    const isRTL = lang === 'ar';
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.ar;
    const content = type === 'privacy' ? (t as any).privacy : (t as any).terms;

    // Scroll to top when page loads
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [type]);

    if (!content) return null;

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-screen bg-gray-50 dark:bg-dark-bg py-16 px-4 sm:px-6 lg:px-8 animate-fade-in"
        >
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-bold mb-12 group"
                >
                    {isRTL ? <ArrowLeft className="rotate-180" size={20} /> : <ArrowLeft size={20} />}
                    {t.nav.home}
                </Link>

                {/* Header Card */}
                <div className="bg-white dark:bg-dark-card rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-12 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        {type === 'privacy' ? <Shield size={200} /> : <FileText size={200} />}
                    </div>

                    <div className="p-12 relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                {type === 'privacy' ? <Shield size={32} /> : <FileText size={32} />}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
                                    {content.title}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">
                                    <Clock size={14} />
                                    {content.lastUpdated}
                                </div>
                            </div>
                        </div>
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
                            {content.intro}
                        </p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8 mb-16">
                    {content.sections.map((section: any, idx: number) => (section && (
                        <div key={idx} className="bg-white dark:bg-dark-card p-10 rounded-[32px] shadow-xl border border-gray-100/50 dark:border-gray-800/50 hover:border-primary/30 transition-all group">
                            <div className="flex items-start gap-6">
                                <span className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-lg font-black text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                    {idx + 1}
                                </span>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                                        {section.title}
                                    </h2>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )))}
                </div>

                {/* Magical Footer Note */}
                <div className="text-center p-12 bg-gradient-to-br from-primary/5 via-purple-500/5 to-indigo-500/5 rounded-[40px] border border-primary/10 relative overflow-hidden">
                    <Sparkles className="absolute top-4 left-4 text-primary/20 animate-pulse" size={40} />
                    <Sparkles className="absolute bottom-4 right-4 text-primary/20 animate-pulse delay-500" size={40} />

                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                        {isRTL ? 'بيئة آمنة وسحرية' : 'A Safe & Magical Environment'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
                        {isRTL
                            ? 'نحن نلتزم بجعل تجربة طفلك على جين عربي آمنة وممتعة وملهمة دائماً.'
                            : 'We are committed to making your child\'s experience on Jeen Arabi always safe, fun, and inspiring.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
