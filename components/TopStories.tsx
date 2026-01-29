import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Story, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface TopStoriesProps {
    lang: Language;
}

export const TopStories: React.FC<TopStoriesProps> = ({ lang }) => {
    const isRTL = lang === 'ar';
    const t = TRANSLATIONS[lang];
    const topStoriesText = (t as any).reviews?.topStories || 'Top Stories';
    const seeMoreText = (t as any).reviews?.seeMore || 'See More';

    const [topStories, setTopStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopStories = async () => {
            try {
                // Get all stories and calculate top 3 based on views + downloads
                const response = await api.get('/stories');
                const stories: Story[] = response.data;
                
                // Sort by popularity (views + downloads * 2)
                const sorted = stories
                    .map(story => ({
                        ...story,
                        popularity: (story.views || 0) + (story.downloads || 0) * 2
                    }))
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 3);

                setTopStories(sorted);
            } catch (error) {
                console.error('Failed to fetch top stories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopStories();
    }, []);

    if (loading) {
        return (
            <div className="py-20 bg-gray-50 dark:bg-dark-card/30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="animate-pulse flex justify-center">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (topStories.length === 0) return null;

    return (
        <div className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-dark-bg dark:to-dark-card/30">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full mb-4">
                        <TrendingUp className="text-primary" size={20} />
                        <span className="text-primary font-bold">{topStoriesText}</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {lang === 'ar' ? 'أشهر القصص' : lang === 'fr' ? 'Histoires Populaires' : 'Most Popular Stories'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {lang === 'ar' 
                            ? 'القصص الأكثر قراءة وتحميلاً من قبل مجتمعنا السحري'
                            : lang === 'fr'
                            ? 'Les histoires les plus lues et téléchargées par notre communauté magique'
                            : 'The most read and downloaded stories by our magical community'
                        }
                    </p>
                </div>

                {/* Stories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {topStories.map((story, index) => (
                        <Link
                            key={story.id}
                            to={`/library?story=${story.id}`}
                            className="group relative bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-4 left-4 z-10 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                                {index + 1}
                            </div>

                            {/* Cover Image */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={story.coverImage}
                                    alt={story.title[lang] || story.title.en}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>

                            {/* Content - Fixed height structure for alignment */}
                            <div className="p-6 flex flex-col">
                                {/* Title: max 2 lines, min height to match 2 lines */}
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                    {story.title[lang] || story.title.en}
                                </h3>
                                
                                {/* Description: Always 3 lines for consistency */}
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 min-h-[4.5rem]">
                                    {story.description?.[lang] || story.description?.en || ''}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm mb-4">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                            {story.views || 0}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {story.downloads || 0} {lang === 'ar' ? 'تحميل' : 'downloads'}
                                        </span>
                                    </div>
                                </div>

                                {/* Read Button - Now always aligned */}
                                <button className="mt-auto w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                                    {lang === 'ar' ? 'اقرأ الآن' : lang === 'fr' ? 'Lire Maintenant' : 'Read Now'}
                                    <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* See More Button */}
                <div className="text-center">
                    <Link
                        to="/library"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                        {seeMoreText}
                        <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                    </Link>
                </div>
            </div>
        </div>
    );
};
