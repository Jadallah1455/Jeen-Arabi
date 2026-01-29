import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Story, Language, Category } from '../types';
import { TRANSLATIONS } from '../constants';
import { BookOpen, Download, X, Eye, ChevronDown, Info, Maximize2, Minimize2, Rocket, Search, Sparkles, ChevronLeft, ChevronRight, Tag, Heart, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEO } from '../components/SEO';
import { StoryReader } from '../components/StoryReader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface LibraryProps {
    lang: Language;
    stories: Story[];
    categories: Category[];
    onUpdateStats: (id: string, type: 'view' | 'download') => void;
}

export const Library: React.FC<LibraryProps> = ({ lang, stories, categories, onUpdateStats }) => {
    const t = TRANSLATIONS[lang].library;
    const { isAuthenticated } = useAuth();
    const [selectedAge, setSelectedAge] = useState<string>('all');
    const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [readingStory, setReadingStory] = useState<Story | null>(null);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const storiesPerPage = 9;
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-open story from notification site state OR query parameter
    useEffect(() => {
        const state = location.state as { openStoryId?: string };
        const params = new URLSearchParams(location.search);
        const storyIdFromQuery = params.get('story');
        
        // Priority: query parameter > state
        const storyId = storyIdFromQuery || state?.openStoryId;
        
        if (storyId) {
            const story = stories.find(s => s.id === storyId);
            if (story) {
                setSelectedStory(story);
                // Clear state so it doesn't re-open on refresh
                window.history.replaceState({}, document.title);
            }
        }
    }, [location, stories]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const isRTL = lang === 'ar';

    // Fetch favorites from backend if logged in
    useEffect(() => {
        const fetchFavorites = async () => {
            if (isAuthenticated) {
                try {
                    const res = await api.get('/favorites');
                    setFavorites(res.data.map((s: any) => s.id));
                } catch (err) {
                    console.error('Error fetching favorites:', err);
                }
            } else {
                // Fallback to local storage for guests (preview only)
                const saved = localStorage.getItem('jeen-arabi-favorites');
                if (saved) setFavorites(JSON.parse(saved));
            }
        };
        fetchFavorites();
    }, [isAuthenticated]);

    // SEO Data from constants
    const seoData = TRANSLATIONS[lang].seo.library;
    const siteName = seoData.siteName;

    const pageTitle = selectedStory
        ? `${selectedStory.title[lang] || selectedStory.title.en} | ${siteName}`
        : `${seoData.title} | ${siteName}`;

    const pageDescription = selectedStory
        ? (selectedStory.description[lang] || selectedStory.description.en || 'Jeen Arabi')
        : seoData.description;

    // Extract unique tags
    const allTags = Array.from(new Set(stories.flatMap(s => s.tags || [])));

    const filteredStories = stories.filter((story) => {
        const ageMatch = selectedAge === 'all' || story.ageGroup === selectedAge;

        // STRICT LANGUAGE FILTERING
        let langMatch = true;
        if (selectedLangFilter !== 'all') {
            const filterLang = selectedLangFilter as Language;
            langMatch = story.availableLanguages?.includes(filterLang);
        }

        const categoryMatch = selectedCategory === 'all' || (story.categories || []).includes(selectedCategory);
        const tagMatch = selectedTag === 'all' || (story.tags || []).includes(selectedTag);

        const favoriteMatch = !showFavoritesOnly || favorites.includes(story.id);

        const query = searchQuery.toLowerCase();
        const searchMatch = !searchQuery ||
            (story.title[lang] || story.title.en || '').toLowerCase().includes(query) ||
            (story.description[lang] || story.description.en || '').toLowerCase().includes(query);

        return ageMatch && langMatch && categoryMatch && tagMatch && favoriteMatch && searchMatch;
    });

    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('jeen-arabi-favorites', JSON.stringify(favorites));
        }
    }, [favorites, isAuthenticated]);

    const toggleFavorite = async (e: React.MouseEvent, storyId: string) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        try {
            const res = await api.post(`/favorites/${storyId}`);
            if (res.data.isFavorite) {
                setFavorites(prev => [...prev, storyId]);
                toast.success(isRTL ? 'تمت الإضافة للمفضلة ✨' : 'Added to favorites ✨');
            } else {
                setFavorites(prev => prev.filter(id => id !== storyId));
                toast.success(isRTL ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            toast.error(isRTL ? 'خطأ في تحديث المفضلة' : 'Error updating favorites');
        }
    };

    const handleDownload = (e: React.MouseEvent, story: Story) => {
        e.stopPropagation();
        onUpdateStats(story.id, 'download');

        const link = document.createElement('a');
        link.href = story.pdfUrl;
        link.download = `${story.title.en || 'story'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRead = (e: React.MouseEvent, story: Story) => {
        e.stopPropagation();
        onUpdateStats(story.id, 'view');
        setReadingStory(story);
        setSelectedStory(null); // Close preview modal if open
    };

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        setSelectedTag(tag);
        setCurrentPage(1);
    };

    const handleShare = (e: React.MouseEvent, storyId: string) => {
        e.stopPropagation();
        const url = `${window.location.origin}/library/${storyId}`;
        navigator.clipboard.writeText(url);
        toast.success(isRTL ? 'تم نسخ الرابط!' : 'Link copied to clipboard!');
    };

    const handleCategoryClick = (e: React.MouseEvent, catId: string) => {
        e.stopPropagation();
        setSelectedCategory(catId);
        setCurrentPage(1);
    };

    const getCategoryName = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? (cat.name[lang] || cat.name.en || 'Unknown') : 'Unknown';
    };

    // Sync URL with Selected Story
    useEffect(() => {
        if (id && stories.length > 0) {
            const story = stories.find(s => s.id === id);
            if (story) {
                setSelectedStory(story);
            }
        }
    }, [id, stories]);


    useEffect(() => {
        if (selectedStory) {
            navigate(`/library/${selectedStory.id}`, { replace: true });
        } else {
            // Only clear URL if we are actually in a story route
            if (id) {
                navigate('/library', { replace: true });
            }
        }
    }, [selectedStory, navigate, id]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Custom Select Component
    const CustomSelect = ({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: { val: string, label: string }[], label: string }) => (
        <div className="relative group bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/50 transition-colors shadow-sm h-14 flex items-center px-4 cursor-pointer">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                {label}:
            </span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-full bg-transparent border-none text-gray-900 dark:text-white font-bold text-sm focus:ring-0 cursor-pointer pl-2 pr-8 outline-none appearance-none ${isRTL ? 'text-right' : 'text-left'}`}
            >
                {options.map(opt => (
                    <option key={opt.val} value={opt.val} className="text-gray-900 dark:text-white bg-white dark:bg-dark-card">
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-gray-400 group-hover:text-primary transition-colors ${isRTL ? 'left-3' : 'right-3'}`}>
                <ChevronDown size={18} />
            </div>
        </div>
    );

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8"
        >
            <SEO
                title={selectedStory ? (selectedStory.title[lang] || selectedStory.title.en) : t.title}
                description={selectedStory ? (selectedStory.description[lang] || selectedStory.description.en) : TRANSLATIONS[lang].seo.library.description}
                keywords={TRANSLATIONS[lang].seo.library.keywords}
                image={selectedStory?.coverImage}
                type={selectedStory ? 'book' : 'website'}
                lang={lang}
            />
            {/* The Helmet component was removed as SEO component replaces it */}

            <div className="max-w-7xl mx-auto pt-20">
                <div className={`flex flex-col md:flex-row justify-between items-center mb-12 gap-4`}>
                    <h1 className={`text-4xl md:text-5xl font-bold text-gray-900 dark:text-white animate-slide-up`}>
                        {t.title}
                    </h1>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${showFavoritesOnly
                                ? 'bg-red-500 text-white shadow-red-200'
                                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/30'
                                }`}
                        >
                            <Heart size={20} fill={showFavoritesOnly ? "currentColor" : "none"} />
                            <span className="hidden sm:inline">{isRTL ? 'المفضلة' : 'My Favorites'}</span>
                        </button>
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                            {filteredStories.length} {t.storiesAvailable}
                        </p>
                    </div>
                </div>

                {/* Premium Search Bar */}
                <div className="relative group max-w-6xl mx-auto mb-16 animate-fade-in">
                    <div className="absolute inset-x-0 -bottom-6 h-16 bg-primary/10 blur-3xl rounded-full opacity-60 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-dark-card border-2 border-gray-100 dark:border-gray-800 group-focus-within:border-primary group-focus-within:shadow-[0_0_0_4px_rgba(108,99,255,0.1)] rounded-[32px] shadow-2xl transition-all flex items-center px-6 py-1">
                        <div className="text-gray-400 group-focus-within:text-primary transition-colors">
                            <Search size={22} aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder={isRTL ? "ابحث عن قصة سحرية بالاسم أو التصنيف..." : "Search for a magical story by title or category..."}
                            className="w-full pl-4 pr-4 py-8 bg-transparent text-xl font-bold outline-none focus-visible:outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            aria-label={isRTL ? 'بحث في القصص' : 'Search stories'}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                className="p-3 text-gray-400 hover:text-red-500 transition-colors mr-2"
                            >
                                <X size={20} />
                            </button>
                        )}
                        <div className="hidden sm:flex items-center bg-primary hover:bg-primary-dark text-white p-5 px-8 rounded-[24px] shadow-lg transition-all active:scale-95 gap-2 font-bold cursor-pointer">
                            <Sparkles size={20} />
                            <span>{isRTL ? 'استكشف' : 'Explore'}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-fade-in`} style={{ animationDelay: '0.1s' }}>
                    <CustomSelect
                        label={isRTL ? "العمر" : "Age"}
                        value={selectedAge}
                        onChange={(val) => { setSelectedAge(val); setCurrentPage(1); }}
                        options={[
                            { val: "all", label: t.all },
                            { val: "3-5", label: "3-5" },
                            { val: "6-8", label: "6-8" },
                            { val: "9-12", label: "9-12" }
                        ]}
                    />
                    <CustomSelect
                        label={isRTL ? "اللغة" : "Language"}
                        value={selectedLangFilter}
                        onChange={(val) => { setSelectedLangFilter(val); setCurrentPage(1); }}
                        options={[
                            { val: "all", label: t.all },
                            { val: "ar", label: "Arabic" },
                            { val: "en", label: "English" },
                            { val: "fr", label: "French" }
                        ]}
                    />
                    <CustomSelect
                        label={isRTL ? "التصنيف" : "Category"}
                        value={selectedCategory}
                        onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
                        options={[
                            { val: "all", label: t.all },
                            ...categories.map(cat => ({ val: cat.id, label: cat.name[lang] || cat.name.en || 'Unknown' }))
                        ]}
                    />
                    <CustomSelect
                        label={isRTL ? "الموضوع" : "Topic"}
                        value={selectedTag}
                        onChange={(val) => { setSelectedTag(val); setCurrentPage(1); }}
                        options={[
                            { val: "all", label: t.all },
                            ...allTags.map(tag => ({ val: tag as string, label: tag as string }))
                        ]}
                    />
                </div>

                {/* Content Area */}
                {stories.length === 0 ? (
                    // Scenario 1: No Stories at all (Coming Soon)
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                            <Rocket size={80} className="text-primary relative z-10 animate-bounce" />
                        </div>
                        <h2 className={`text-3xl font-bold text-gray-900 dark:text-white mb-4`}>
                            {isRTL ? 'انتظروا المرح قريباً!' : 'The Magic is Coming Soon!'}
                        </h2>
                        <p className={`text-xl text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed`}>
                            {isRTL
                                ? 'نحن نجهز مجموعة رائعة من القصص الممتعة. عد إلينا قريباً لتكتشف عالماً من الخيال!'
                                : 'We are preparing a wonderful collection of stories. Check back soon to discover a world of imagination!'}
                        </p>
                    </div>
                ) : filteredStories.length === 0 ? (
                    // Scenario 2: No Results / No Favorites
                    <div className="text-center py-24 animate-fade-in bg-white/50 dark:bg-dark-card/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-inner max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                            {showFavoritesOnly ? (
                                <Heart size={44} className="text-red-400 animate-pulse" fill="currentColor" />
                            ) : (
                                <X size={44} className="text-gray-400" />
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {showFavoritesOnly ? t.noFavoritesTitle : t.noResultsTitle}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-10 text-lg font-medium leading-relaxed">
                            {showFavoritesOnly ? t.noFavoritesDesc : t.noResultsDesc}
                        </p>
                        <button
                            onClick={() => {
                                setSelectedAge('all');
                                setSelectedLangFilter('all');
                                setSelectedCategory('all');
                                setSelectedTag('all');
                                setSearchQuery('');
                                setShowFavoritesOnly(false);
                                setCurrentPage(1);
                            }}
                            className="px-10 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary-dark transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95"
                        >
                            {t.exploreAll}
                        </button>
                    </div>
                ) : (
                    // Scenario 3: Show Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredStories.slice((currentPage - 1) * storiesPerPage, currentPage * storiesPerPage).map((story, index) => {
                            // IMPROVED MULTILINGUAL FALLBACK: prioritizing existing content over 'Untitled'
                            const displayTitle = story.title[lang] || story.title.ar || story.title.en || Object.values(story.title).find(v => v && v !== '') || 'Untitled';
                            const displayDesc = story.description[lang] || story.description.ar || story.description.en || Object.values(story.description).find(v => v && v !== '') || '';
                            const isStoryRTL = (lang === 'ar') || (!story.title[lang] && story.title.ar);

                            return (
                                <article
                                    key={story.id}
                                    onClick={() => setSelectedStory(story)}
                                    className="group card-hover bg-white dark:bg-dark-card rounded-3xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col animate-slide-up relative cursor-pointer"
                                    style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
                                >
                                    {/* Image Container */}
                                    <div className="relative h-96 overflow-hidden rounded-t-3xl group/img">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60"></div>
                                        <img
                                            src={story.coverImage}
                                            alt={story.title[lang] || story.title.ar || story.title.en}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-all duration-700 ease-out"
                                        />
                                        <div className="absolute top-3 right-3 z-30 flex gap-2">
                                            <button
                                                onClick={(e) => toggleFavorite(e, story.id)}
                                                className={`p-2 rounded-full backdrop-blur-md transition-all ${favorites.includes(story.id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white/80 dark:bg-black/50 text-gray-600 dark:text-gray-300 hover:text-red-500'
                                                    }`}
                                            >
                                                <Heart size={18} fill={favorites.includes(story.id) ? "currentColor" : "none"} />
                                            </button>
                                            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-white/20 h-7 flex items-center justify-center min-w-[3rem]">
                                                {story.ageGroup}
                                            </div>
                                        </div>

                                        {/* Stats Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex justify-around text-white text-xs font-medium border-t border-white/10 bg-black/40 backdrop-blur-sm">
                                            <div className="flex items-center gap-1">
                                                <Eye size={14} className="text-blue-300" />
                                                <span>{story.views.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Download size={14} className="text-green-300" />
                                                <span>{story.downloads.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-6 flex-1 flex flex-col ${isStoryRTL ? 'text-right' : 'text-left'}`}>
                                        <div className={`flex flex-wrap gap-2 mb-3 ${isStoryRTL ? 'justify-end' : 'justify-start'}`}>
                                            {/* Categories Badges */}
                                            {(story.categories || []).map(catId => (
                                                <button
                                                    key={catId}
                                                    onClick={(e) => handleCategoryClick(e, catId)}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors z-10"
                                                >
                                                    {getCategoryName(catId)}
                                                </button>
                                            ))}
                                            {/* Tags Badges (Limit to 2) */}
                                            {(story.tags || []).slice(0, 2).map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={(e) => handleTagClick(e, tag)}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>

                                        <h2 className={`text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors ${isStoryRTL ? 'font-arabic' : 'font-sans'}`}>
                                            {displayTitle}
                                        </h2>

                                        <p className={`text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed ${isStoryRTL ? 'font-arabic' : 'font-sans'}`}>
                                            {displayDesc}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <button
                                                onClick={(e) => handleRead(e, story)}
                                                className="flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 font-bold text-sm"
                                            >
                                                <BookOpen size={16} />
                                                {t.read}
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(e, story)}
                                                className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-bold text-sm"
                                            >
                                                <Download size={16} />
                                                {t.download}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {filteredStories.length > storiesPerPage && (
                    <div className="mt-16 flex justify-center items-center gap-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-xl disabled:opacity-30 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {isRTL ? <ChevronRight /> : <ChevronLeft />}
                        </button>
                        <div className="flex gap-2">
                            {Array.from({ length: Math.ceil(filteredStories.length / storiesPerPage) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-12 h-12 rounded-xl font-bold transition-all ${currentPage === i + 1
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary/50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === Math.ceil(filteredStories.length / storiesPerPage)}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-xl disabled:opacity-30 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {isRTL ? <ChevronLeft /> : <ChevronRight />}
                        </button>
                    </div>
                )}
            </div>

            {/* Story Preview Modal */}
            {selectedStory && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedStory(null)}>
                    <div
                        className="bg-white dark:bg-dark-card w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        
                        {/* Main Content Area - Responsive Layout */}
                        <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-y-hidden">
                            {/* Modal Image - Full width on mobile, 40% on desktop */}
                            <div className="w-full lg:max-w-[40%] lg:min-w-[300px] h-64 sm:h-72 lg:h-auto relative bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 lg:p-8 shrink-0 lg:overflow-y-auto">
                                <img
                                    src={selectedStory.coverImage}
                                    alt={`${selectedStory.title[lang] || selectedStory.title.ar || selectedStory.title.en || 'Story'} ${isRTL ? 'غلاف' : 'cover'}`}
                                    className="w-full h-full lg:h-auto lg:max-h-[70vh] object-cover lg:object-contain rounded-2xl shadow-2xl"
                                />
                                {/* Floating Close Button for Mobile */}
                                <button
                                    onClick={() => setSelectedStory(null)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all lg:hidden"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable on both mobile and desktop */}
                            <div className="flex-1 p-6 lg:p-8 flex flex-col overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {/* Categories in Modal */}
                                            {(selectedStory.categories || []).map(catId => (
                                                <button
                                                    key={catId}
                                                    onClick={(e) => { handleCategoryClick(e, catId); setSelectedStory(null); }}
                                                    className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider hover:bg-primary hover:text-white transition-colors"
                                                >
                                                    {getCategoryName(catId)}
                                                </button>
                                            ))}
                                            {/* Tags in Modal */}
                                            {(selectedStory.tags || []).map(tag => (
                                                <button key={tag} onClick={(e) => { handleTagClick(e, tag); setSelectedStory(null); }} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                        <h2 className={`text-3xl font-bold text-gray-900 dark:text-white leading-tight ${(lang === 'ar' || (!selectedStory.title[lang] && selectedStory.title.ar)) ? 'font-arabic text-right' : ''}`}>
                                            {selectedStory.title[lang] || selectedStory.title.ar || selectedStory.title.en || Object.values(selectedStory.title).find(v => v) || 'Untitled'}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleShare(e, selectedStory.id)}
                                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                                            title={isRTL ? 'مشاركة' : 'Share'}
                                        >
                                            <Share2 size={24} />
                                        </button>
                                        {/* Desktop close button */}
                                        <button onClick={() => setSelectedStory(null)} className="hidden md:block p-2 text-gray-400 hover:text-red-500 transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mb-8 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-6">
                                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        <span className="flex items-center gap-1"><Download size={16} /> {t.downloads}: <span className="font-bold text-gray-900 dark:text-white">{selectedStory.downloads}</span></span>
                                        <span className="flex items-center gap-1"><Eye size={16} /> {t.views}: <span className="font-bold text-gray-900 dark:text-white">{selectedStory.views}</span></span>
                                        <span className="flex items-center gap-1"><Info size={16} /> {t.age}: <span className="font-bold text-gray-900 dark:text-white">{selectedStory.ageGroup}</span></span>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none mb-8">
                                    <p className={`text-lg leading-relaxed text-gray-600 dark:text-gray-300 ${(lang === 'ar' || (!selectedStory.description[lang] && selectedStory.description.ar)) ? 'font-arabic text-right' : ''}`}>
                                        {selectedStory.description[lang] || selectedStory.description.ar || selectedStory.description.en || Object.values(selectedStory.description).find(v => v) || ''}
                                    </p>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-4">
                                    <button
                                        onClick={(e) => handleRead(e, selectedStory)}
                                        className="flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 font-bold text-lg"
                                    >
                                        <BookOpen size={20} />
                                        {t.read}
                                    </button>
                                    <button
                                        onClick={(e) => handleDownload(e, selectedStory)}
                                        className="flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold text-lg transition-colors"
                                    >
                                        <Download size={20} />
                                        {t.download}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Prompt Modal */}
            {
                showLoginPrompt && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
                            <div className="relative h-32 bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                                <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
                                    <button onClick={() => setShowLoginPrompt(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/30">
                                    <Heart size={40} className="text-white" fill="white" />
                                </div>
                            </div>
                            <div className="p-10 text-center">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                                    {isRTL ? "تحتاج لتسجيل الدخول" : (lang === 'fr' ? "Connexion requise" : "Login Required")}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                                    {isRTL
                                        ? "سجل دخولك الآن لتتمكن من إضافة أجمل القصص إلى مفضلتك والوصول إليها في أي وقت!"
                                        : "Sign in now to add your favorite stories and access them anytime, anywhere!"}
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1"
                                    >
                                        {isRTL ? "تسجيل الدخول" : "Sign In"}
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold transition-colors"
                                    >
                                        {isRTL ? "إنشاء حساب جديد" : "Create New Account"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Immersive Reader "Zen Mode" */}
            {
                readingStory && (
                    <StoryReader
                        id={readingStory.id}
                        pdfUrl={readingStory.pdfUrl}
                        title={readingStory.title[lang] || readingStory.title.en || 'Story'}
                        coverImage={readingStory.coverImage}
                        pages={readingStory.pages} // Pass the generated images
                        language={lang}
                        quizData={readingStory.quizData}
                        onClose={() => {
                            if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
                            setReadingStory(null);
                        }}
                    />
                )}
        </div>
    );
};