import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Language } from '../types';

interface NotFoundProps {
    lang: Language;
}

export const NotFound: React.FC<NotFoundProps> = ({ lang }) => {
    const isAr = lang === 'ar';

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                <h1 className="relative text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-bounce">
                    404
                </h1>
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4`}>
                {isAr ? 'أوه! يبدو أننا تهنا في الفضاء' : 'Oops! Looks like we got lost in space'}
            </h2>

            <p className={`text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md`}>
                {isAr
                    ? 'الصفحة التي تبحث عنها قد تكون اختفت في ثقب أسود أو لم تكن موجودة أصلاً.'
                    : 'The page you are looking for might have vanished into a black hole or never existed.'}
            </p>

            <div className="flex gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl"
                >
                    <Home size={20} />
                    <span>{isAr ? 'العودة للرئيسية' : 'Back Home'}</span>
                </Link>

                <Link
                    to="/library"
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Compass size={20} />
                    <span>{isAr ? 'استكشف القصص' : 'Explore Stories'}</span>
                </Link>
            </div>
        </div>
    );
};
