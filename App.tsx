import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { FloatingShapes } from './components/FloatingShapes';
import { Language, Story, Subscriber, Category } from './types';
import { Sparkles, Heart, Lock, X, Loader2 } from 'lucide-react';
import api from './services/api';
import { STICKERS, TRANSLATIONS } from './constants';
import { useAuth } from './context/AuthContext';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Library = lazy(() => import('./pages/Library').then(module => ({ default: module.Library })));
const DesignStudio = lazy(() => import('./pages/DesignStudio').then(module => ({ default: module.DesignStudio })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Dashboard = lazy(() => import('./pages/UserDashboard').then(module => ({ default: module.UserDashboard })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const AccountSettings = lazy(() => import('./pages/AccountSettings').then(module => ({ default: module.AccountSettings })));
const Support = lazy(() => import('./pages/Support'));
const LegalPage = lazy(() => import('./pages/LegalPage').then(module => ({ default: module.LegalPage })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

function App() {
  const { isAuthenticated, isAdmin, user, logout, loading: authLoading } = useAuth();

  // 1. Language Setup

  const [lang, setLang] = useState<Language>(() => {
    // 1. Check LocalStorage (User Preference)
    const savedLang = localStorage.getItem('jeen-arabi-lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) return savedLang;

    // 2. Check Browser Language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ar') return 'ar';
    if (browserLang === 'fr') return 'fr';
    if (browserLang === 'en') return 'en';

    // 3. Default
    return 'ar';
  });

  useEffect(() => {
    localStorage.setItem('jeen-arabi-lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // 2. State Management for Data
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // 3. PWA Install Logic
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  // Detect if device is mobile/tablet
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 1024; // Tablets and below
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide install banner after 10 seconds
  useEffect(() => {
    if (showInstallBanner && isMobile) {
      const timer = setTimeout(() => {
        setShowInstallBanner(false);
        // Set it to reappear after 1 hour
        setTimeout(() => {
          const isInstalled = localStorage.getItem('app-installed');
          if (!isInstalled) {
            setShowInstallBanner(true);
          }
        }, 60 * 60 * 1000); // 1 hour
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showInstallBanner, isMobile]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App installed!');
      localStorage.setItem('app-installed', 'true'); // Mark as installed
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  // 4. Fetch Initial Data (Stories, Categories, Settings)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storiesRes, categoriesRes, settingsRes] = await Promise.all([
          api.get('/stories'),
          api.get('/categories'),
          api.get('/settings')
        ]);
        setStories(storiesRes.data);
        setCategories(categoriesRes.data);

        // Map settings
        const settingsMap: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => settingsMap[s.key] = s.value);
        setSettings(settingsMap);

        // Fetch subscribers if admin
        if (isAdmin) {
          try {
            const subscribersRes = await api.get('/subscribers');
            setSubscribers(subscribersRes.data);
          } catch (err) { /* Not an admin or error */ }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Small delay for the magic to feel real
      }
    };
    fetchData();
  }, [isAuthenticated, isAdmin]);

  // 5. Update Stats Handler
  const handleUpdateStats = async (storyId: string, type: 'view' | 'download') => {
    try {
      await api.patch(`/stories/${storyId}/${type}`);
      setStories(prev => prev.map(story => {
        if (story.id === storyId) {
          return {
            ...story,
            views: type === 'view' ? story.views + 1 : story.views,
            downloads: type === 'download' ? story.downloads + 1 : story.downloads
          };
        }
        return story;
      }));
    } catch (error) {
      // Silently fail for stats
    }
  };

  // 6. Theme Toggle
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  if (authLoading || (loading && stories.length === 0)) {
    const welcomeMsg = lang === 'ar' ? settings.welcome_msg_ar : settings.welcome_msg_en;
    return <LoadingScreen lang={lang} welcomeMsg={welcomeMsg} />;
  }

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-sans'} bg-background dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col relative`}>

        <FloatingShapes />
        <Navbar
          lang={lang}
          setLang={setLang}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
        />

        <div className="flex-grow">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home lang={lang} />} />
              <Route path="/library" element={<Library lang={lang} stories={stories} categories={categories} onUpdateStats={handleUpdateStats} />} />
              <Route path="/library/:id" element={<Library lang={lang} stories={stories} categories={categories} onUpdateStats={handleUpdateStats} />} />
              <Route path="/design" element={<DesignStudio lang={lang} />} />

              <Route path="/login" element={isAuthenticated ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login lang={lang} />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register lang={lang} />} />

              <Route path="/dashboard" element={isAuthenticated ? <Dashboard lang={lang} /> : <Navigate to="/login" />} />
              <Route path="/settings" element={isAuthenticated ? <AccountSettings lang={lang} /> : <Navigate to="/login" />} />

              <Route
                path="/admin"
                element={isAdmin ? <Admin lang={lang} stories={stories} setStories={setStories} subscribers={subscribers} setSubscribers={setSubscribers} categories={categories} setCategories={setCategories} /> : <Navigate to="/login" />}
              />
              <Route path="/support" element={<Support lang={lang} />} />
              <Route path="/support/:lang" element={<Support lang={lang} />} />

              <Route path="/privacy" element={<LegalPage lang={lang} type="privacy" />} />
              <Route path="/terms" element={<LegalPage lang={lang} type="terms" />} />

              <Route path="*" element={<NotFound lang={lang} />} />
            </Routes>
          </Suspense>
        </div>

        {/* --- Magical PWA Install Banner --- */}
      {loading || authLoading ? null : (
        <>
          {showInstallBanner && isMobile && (
            <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up"
              style={{ maxWidth: '400px', margin: '0 auto' }}
            >
              <div className="bg-white dark:bg-dark-card p-4 rounded-[22px] flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Sparkles size={60} />
                </div>

                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 animate-pulse">
                  <Heart fill="currentColor" size={24} />
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                    {lang === 'ar' ? 'تثبيت جين عربي' : 'Install Jeen Arabi'}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-bold">
                    {lang === 'ar' ? 'استمتع بالقصص كأنه تطبيق!' : 'Read stories like a native app!'}
                  </p>
                </div>

                <button
                  onClick={handleInstall}
                  className="bg-primary text-white p-2 px-3 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  {lang === 'ar' ? 'تثبيت' : 'Install'}
                </button>

                <button
                  onClick={() => {
                    setShowInstallBanner(false);
                    // Reappear after 1 hour
                    setTimeout(() => {
                      const isInstalled = localStorage.getItem('app-installed');
                      if (!isInstalled) {
                        setShowInstallBanner(true);
                      }
                    }, 60 * 60 * 1000); // 1 hour
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg z-10"
                  title={lang === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

        <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 py-10 mt-auto">
          <div className={`max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm relative ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
            <p className="mb-4">
              &copy; {new Date().getFullYear()} {TRANSLATIONS[lang].footer.rights}.
              <a href="https://genarabi.com/" target="_blank" rel="noopener noreferrer" className="ms-1 font-bold text-primary hover:underline">GenArabi.com</a>
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs md:text-sm">
              <Link to="/privacy" onClick={() => window.scrollTo({top: 0, behavior: 'auto'})} className="hover:text-primary cursor-pointer transition-colors px-2">{TRANSLATIONS[lang].footer.privacy}</Link>
              <span className="hidden md:inline text-gray-300">|</span>
              <Link to="/terms" onClick={() => window.scrollTo({top: 0, behavior: 'auto'})} className="hover:text-primary cursor-pointer transition-colors px-2">{TRANSLATIONS[lang].footer.terms}</Link>
              <span className="hidden md:inline text-gray-300">|</span>
              <Link to="/support" className="text-red-500 font-bold hover:scale-105 transition-transform inline-flex items-center gap-2 px-2">
                <Heart size={16} fill="currentColor" />
                {TRANSLATIONS[lang].nav.support}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;