import React, { useEffect, useState } from 'react';
import { Sparkles, Star, BookOpen } from 'lucide-react';
import { Language } from '../types';

interface LoadingScreenProps {
    lang: Language;
    welcomeMsg?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ lang, welcomeMsg }) => {
    const isRTL = lang === 'ar';
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setOpacity(1), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[1000] bg-white dark:bg-dark-bg flex flex-col items-center justify-center transition-opacity duration-1000 overflow-hidden"
            style={{ opacity }}
        >
            {/* Background Magic Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-blob"></div>

                {[...Array(6)].map((_, i) => (
                    <Sparkles
                        key={i}
                        className={`absolute text-primary/30 animate-float opacity-40`}
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.5}s`,
                            width: `${20 + Math.random() * 30}px`
                        }}
                    />
                ))}
            </div>

            {/* Rotating Magic Book */}
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse scale-150"></div>
                <div className="relative z-10 p-8 bg-white dark:bg-dark-card rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 animate-float">
                    <BookOpen size={80} className="text-primary animate-pulse" />
                </div>
                {/* Orbital Stars */}
                <Star className="absolute -top-4 -right-4 text-yellow-400 animate-spin-slow" size={32} fill="currentColor" />
                <Star className="absolute -bottom-2 -left-6 text-indigo-400 animate-bounce" size={24} fill="currentColor" />
            </div>

            {/* Content */}
            <div className="text-center px-6 max-w-2xl relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                    {isRTL ? 'جين عربي' : 'Jeen Arabi'}
                </h2>

                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8 rounded-full"></div>

                {welcomeMsg ? (
                    <p className={`text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed animate-fade-in ${isRTL ? 'font-arabic' : 'font-sans'}`}>
                        {welcomeMsg}
                    </p>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-primary font-bold">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                )}
            </div>

            {/* Bottom Credit */}
            <div className="absolute bottom-12 flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <Sparkles size={14} />
                {isRTL ? 'جاري تحضير السحر...' : 'Preparing magic...'}
            </div>
        </div>
    );
};
