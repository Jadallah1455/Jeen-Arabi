import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { SEO } from '../components/SEO';
import { ChevronRight } from 'lucide-react';
import { TopStories } from '../components/TopStories';
import { TestimonialsSection } from '../components/TestimonialsSection';

interface HomeProps {
  lang: Language;
}

export const Home: React.FC<HomeProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].hero;
  const isRTL = lang === 'ar';

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background dark:bg-dark-bg transition-colors duration-300 overflow-x-hidden">
      <SEO
        title={TRANSLATIONS[lang].seo.home.title}
        description={TRANSLATIONS[lang].seo.home.description}
        keywords={TRANSLATIONS[lang].seo.home.keywords}
        lang={lang}
      />
      {/* Hero Section */}
      <div className="relative min-h-[550px] lg:min-h-[650px] flex items-center justify-center overflow-hidden pb-12 pt-20 lg:pb-32 lg:pt-24 bg-transparent">

        {/* --- Floating Colors & Particles Background --- */}
        <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          {/* Large Color Blobs */}
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-purple-400/40 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-70 animate-blob"></div>
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-yellow-300/40 dark:bg-yellow-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[30%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-pink-400/30 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute top-[-5%] right-[25%] w-[250px] h-[250px] bg-cyan-300/40 dark:bg-cyan-800/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-60 animate-float animation-delay-2000"></div>
          <div className="absolute bottom-[10%] left-[10%] w-[200px] h-[200px] bg-lime-300/40 dark:bg-lime-800/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[70px] opacity-50 animate-float"></div>
          <div className="absolute top-[40%] right-[-5%] w-[300px] h-[300px] bg-indigo-400/30 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-4000"></div>

          {/* Magic Particles / Sparkles */}
          <div className="absolute top-[15%] left-[15%] w-3 h-3 bg-yellow-100 rounded-full blur-[1px] animate-pulse opacity-80"></div>
          <div className="absolute top-[25%] right-[20%] w-2 h-2 bg-white rounded-full blur-[0.5px] animate-float animation-delay-2000 opacity-70"></div>
          <div className="absolute bottom-[30%] left-[25%] w-4 h-4 bg-blue-100 rounded-full blur-[2px] animate-float animation-delay-4000 opacity-60"></div>
          <div className="absolute bottom-[15%] right-[10%] w-2 h-2 bg-pink-100 rounded-full blur-[1px] animate-pulse opacity-80"></div>
          <div className="absolute top-[40%] left-[5%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-[10%] right-[40%] w-2 h-2 bg-cyan-100 rounded-full blur-[1px] animate-float opacity-70"></div>
          <div className="absolute bottom-[40%] left-[50%] w-1 h-1 bg-white rounded-full blur-[0.5px] animate-float animation-delay-2000 opacity-50"></div>
          <div className="absolute top-[20%] right-[5%] w-3 h-3 bg-orange-100 rounded-full blur-[2px] animate-pulse opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">

            {/* Text Content */}
            <div className={`flex-1 text-center lg:text-start relative`}>
              {/* Subtle glow directly behind text for readability lift */}
              <div className="absolute -inset-10 bg-white/30 dark:bg-black/10 blur-3xl -z-10 rounded-full hidden lg:block"></div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-gray-700 mb-6 animate-fade-in shadow-sm mx-auto lg:mx-0">
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className={`text-xs sm:text-sm font-bold tracking-wide text-gray-600 dark:text-gray-300 uppercase`}>
                  {t.badge}
                </span>
              </div>

              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-[1.15] tracking-tight`}>
                <span className="block text-gray-800 dark:text-gray-100 mb-2">{t.title.split(' ')[0]}</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-pulse">
                  {t.title.split(' ').slice(1).join(' ')}
                </span>
              </h1>

              <p className={`mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8 px-2 lg:px-0 ${isRTL ? 'font-arabic' : 'font-sans'}`}>
                {t.subtitle}
              </p>

              <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start`}>
                <Link
                  to="/library"
                  className="px-8 py-4 rounded-2xl text-white bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-1 transition-all font-bold text-lg flex items-center justify-center gap-2 ring-4 ring-white/20 dark:ring-black/20"
                >
                  {t.cta}
                  {!isRTL && <ChevronRight size={20} />}
                  {isRTL && <ChevronRight size={20} className="rotate-180" />}
                </Link>
                <Link
                  to="/design"
                  className="px-8 py-4 rounded-2xl text-gray-700 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all font-bold text-lg"
                >
                  {t.secondaryCta}
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 relative w-full flex justify-center lg:justify-end">
              <div className="relative z-10 w-48 sm:w-64 lg:w-full max-w-md">
                {/* Stronger Glow effect specifically behind the image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/40 to-pink-500/40 rounded-full blur-[60px] transform scale-110 animate-pulse"></div>

                <img
                  className="w-full h-auto object-contain drop-shadow-2xl animate-float relative z-10"
                  src="https://cdn-icons-png.flaticon.com/512/3408/3408545.png"
                  alt="Happy children reading"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 relative bg-gray-50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.map((feature: any, idx: number) => (
              <div
                key={idx}
                className="group bg-white dark:bg-dark-card p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transform transition-all duration-300 hover:-translate-y-2 text-center relative overflow-hidden"
              >
                {/* Decorative background circle on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                <div className={`w-20 h-20 mx-auto rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                <h3 className={`text-2xl font-bold mb-3 text-gray-900 dark:text-white ${isRTL ? 'font-arabic' : ''}`}>
                  {feature.title}
                </h3>

                <p className={`text-gray-500 dark:text-gray-400 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Stories Section */}
      <TopStories lang={lang} />

      {/* Testimonials Section */}
      <TestimonialsSection lang={lang} />
    </div>
  );
};