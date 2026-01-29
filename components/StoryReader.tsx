import React, { useState, useEffect, useRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, Volume2, VolumeX, Download, AlertCircle, RefreshCw, BookOpen, FileText, Image as ImageIcon, Share2, Play, Square, Music } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { StoryQuiz } from './StoryQuiz';
import { TRANSLATIONS } from '../constants';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// إعداد الـ Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const CanvasPage = React.memo(({ pageNumber, renderPage, isRendered }: { pageNumber: number, renderPage: (num: number, canvas: HTMLCanvasElement) => void, isRendered: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            renderPage(pageNumber, canvasRef.current);
        }
    }, [pageNumber, renderPage, isRendered]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-white">
            {!isRendered && (
                <>
                    <Loader2 className="animate-spin text-gray-300" aria-hidden="true" />
                    <span className="sr-only">
                        Loading page {pageNumber}
                    </span>
                </>
            )}
            <canvas
                ref={canvasRef}
                className={`w-full h-full object-contain ${!isRendered ? 'hidden' : ''}`}
                aria-label={`Page ${pageNumber}`}
            />
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.isRendered === nextProps.isRendered && prevProps.pageNumber === nextProps.pageNumber;
});
CanvasPage.displayName = 'CanvasPage';

const PageWrapper = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number: number }>((props, ref) => {
    return (
        <div className="demoPage bg-white overflow-hidden flex flex-col items-center justify-center relative shadow-md" ref={ref} style={{ width: '100%', height: '100%' }}>
            {props.children}
        </div>
    );
});
PageWrapper.displayName = 'PageWrapper';

interface StoryReaderProps {
    id?: string;
    pdfUrl: string;
    title: string;
    coverImage?: string;
    pages?: string[];
    onClose: () => void;
    language?: 'ar' | 'en' | 'fr';
    quizData?: { question: string; options: string[]; correctAnswer: number }[];
}

export const StoryReader: React.FC<StoryReaderProps> = ({ id, pdfUrl, title, coverImage, pages, onClose, language = 'ar', quizData }) => {
    const bookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const flipSound = useRef<HTMLAudioElement | null>(null);
    const bgMusic = useRef<HTMLAudioElement | null>(null);
    const celebrationSound = useRef<HTMLAudioElement | null>(null);
    const { isAuthenticated } = useAuth();

    // Unified reading history & progress management
    useEffect(() => {
        if (isAuthenticated && id) {
            api.post(`/users/history/${id}`).then(res => {
                if (res.data.progress) {
                    setSavedProgress(res.data.progress);
                    if (res.data.progress.lastPageReached > 0 && !res.data.progress.isCompleted) {
                        setShowResumePrompt(true);
                    }
                }
            }).catch(err => console.error('Error recording history:', err));
        }
    }, [id, isAuthenticated]);

    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pagesRendered, setPagesRendered] = useState<boolean[]>([]);
    const [aspectRatio, setAspectRatio] = useState(480 / 670);
    const [bookDimensions, setBookDimensions] = useState({ width: 480, height: 670 });
    const [viewMode, setViewMode] = useState<'pdf' | 'images'>(pages && pages.length > 0 ? 'images' : 'pdf');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [savedProgress, setSavedProgress] = useState<{ lastPageReached: number, isCompleted: boolean } | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const lastUpdateRef = useRef<number>(Date.now());

    const t = TRANSLATIONS[language]?.library || TRANSLATIONS.en.library;
    const isRTL = language === 'ar';

    // Initializations
    useEffect(() => {
        flipSound.current = new Audio('/sounds/page-flip.mp3');
        flipSound.current.volume = 0.5;

        bgMusic.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3');
        bgMusic.current.loop = true;
        bgMusic.current.volume = 0.2;

        celebrationSound.current = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3');
        celebrationSound.current.volume = 0.7;

        return () => {
            window.speechSynthesis.cancel();
            if (bgMusic.current) {
                bgMusic.current.pause();
                bgMusic.current = null;
            }
        };
    }, []);

    const isMutedRef = useRef(isMuted);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

    // Load PDF or Images
    useEffect(() => {
        const loadContent = async () => {
            if (viewMode === 'images' && pages && pages.length > 0) {
                setNumPages(pages.length);
                setPagesRendered(new Array(pages.length).fill(true));
                const img = new Image();
                img.onload = () => {
                    setAspectRatio(img.width / img.height);
                    setIsLoading(false);
                };
                img.onerror = () => setIsLoading(false);
                img.src = pages[0];
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const loadingTask = pdfjsLib.getDocument({
                    url: pdfUrl,
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                });
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setPagesRendered(new Array(doc.numPages).fill(false));
                const firstPage = await doc.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1 });
                setAspectRatio(viewport.width / viewport.height);
                setIsLoading(false);
            } catch (err: any) {
                console.error("Error loading content:", err);
                setError(err);
                setIsLoading(false);
            }
        };

        loadContent();
    }, [pdfUrl, viewMode, pages]);

    // Heartbeat for progress (time and page tracking)
    useEffect(() => {
        if (!isAuthenticated || !id || isLoading || numPages === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const additionalTime = Math.floor((now - lastUpdateRef.current) / 1000);
            if (additionalTime < 5) return; // Avoid jitter

            api.put(`/users/history/${id}/progress`, {
                lastPageReached: pageIndex,
                additionalTime: additionalTime,
                isCompleted: hasFinished
            }).catch(err => console.error('Error updating progress:', err));

            lastUpdateRef.current = now;
        }, 30000); // Pulse every 30 seconds

        return () => clearInterval(interval);
    }, [id, isAuthenticated, pageIndex, hasFinished, isLoading, numPages]);

    // Dimensions management
    useEffect(() => {
        const updateDimensions = () => {
            const isMobile = window.innerWidth < 768;
            const normalHeight = isMobile ? window.innerHeight * 0.55 : window.innerHeight * 0.75;
            const maximizedHeight = isMobile ? window.innerHeight * 0.75 : window.innerHeight * 0.92;

            const targetHeight = isMaximized ? maximizedHeight : normalHeight;
            const maxWidth = window.innerWidth * 0.95;

            let h = targetHeight;
            let w = h * aspectRatio;

            const isSinglePage = isMobile;
            const widthNeeded = isSinglePage ? w : w * 2;

            if (widthNeeded > maxWidth) {
                w = isSinglePage ? maxWidth : maxWidth / 2;
                h = w / aspectRatio;
            }

            setBookDimensions({ width: Math.floor(w), height: Math.floor(h) });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [isMaximized, aspectRatio]);

    const getBookTransform = () => {
        if (window.innerWidth < 768) return 'translateX(0)';
        const shiftAmount = bookDimensions.width / 2;
        if (pageIndex === 0) return `translateX(-${shiftAmount}px)`;
        if (pageIndex === numPages - 1 && numPages % 2 === 0) return `translateX(${shiftAmount}px)`;
        return 'translateX(0)';
    };

    const renderPage = useCallback(async (pageNumber: number, canvas: HTMLCanvasElement) => {
        if (!pdfDoc || !canvas) return;
        const scale = isMaximized ? 2.2 : (window.innerWidth < 600 ? 1.3 : 1.6);
        try {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const context = canvas.getContext('2d');
            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport }).promise;
                setPagesRendered(prev => {
                    if (prev[pageNumber - 1]) return prev;
                    const next = [...prev];
                    next[pageNumber - 1] = true;
                    return next;
                });
            }
        } catch (err) {
            console.error(`Error rendering page ${pageNumber}:`, err);
        }
    }, [pdfDoc, isMaximized]);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!id) return;
        const url = `${window.location.origin}/library/${id}`;
        navigator.clipboard.writeText(url);
        toast.success(t.shareSuccess || (language === 'ar' ? 'تم نسخ رابط القصة!' : 'Story link copied!'));
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const toggleNarrator = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const textToRead = language === 'ar'
                ? `أهلاً بك في مكتبة جين عربي. أنت تقرأ قصة: ${title}`
                : `Welcome to Jeen Arabi Library. You are reading: ${title}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US');
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const toggleMusic = () => {
        if (!bgMusic.current) return;
        if (isMusicPlaying) {
            bgMusic.current.pause();
        } else {
            bgMusic.current.play().catch(() => {
                toast.error(t.musicError || (language === 'ar' ? 'يرجى التفاعل مع الصفحة لتشغيل الموسيقى' : 'Click page to play music'));
            });
        }
        setIsMusicPlaying(!isMusicPlaying);
    };

    const onFlip = useCallback((e: any) => {
        const newPageIndex = e.data;
        if (typeof newPageIndex === 'number') {
            setPageIndex(newPageIndex);

            // Trigger celebration on reaching the last page/spread
            // In spread mode, the last spread starts at numPages - 2 (for even pages)
            const isAtEnd = (window.innerWidth < 768)
                ? (newPageIndex === numPages - 1)
                : (newPageIndex >= numPages - 2);

            if (isAtEnd && numPages > 1 && !hasFinished) {
                setHasFinished(true);
                triggerConfetti();

                // Play celebration sound securely (if not muted)
                if (celebrationSound.current && !isMutedRef.current) {
                    celebrationSound.current.currentTime = 0;
                    celebrationSound.current.play().catch(e => console.log('Celebration sound failed:', e));
                }

                toast.success(t.storyFinished || (language === 'ar' ? 'رائع! لقد أنهيت القصة 🎉' : "Awesome! You've finished the story! 🎉"), {
                    icon: '🌟',
                    duration: 6000
                });

                 if (quizData && quizData.length > 0) {
                    setTimeout(() => setShowQuiz(true), 1500);
                }
            }
        }
        if (!isMutedRef.current && flipSound.current) {
            flipSound.current.currentTime = 0;
            flipSound.current.play().catch(() => { });
        }
    }, [numPages, hasFinished, language, t]);

    const toggleFullscreen = () => {
        const element = containerRef.current as any;
        if (!document.fullscreenElement) {
            if (element.requestFullscreen) element.requestFullscreen();
            setIsMaximized(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsMaximized(false);
        }
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl text-center max-w-md shadow-2xl border border-white/20">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={56} />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t.errorTitle || (language === 'ar' ? 'عذراً، حدث خطأ' : 'Sorry, an error occurred')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">{error.message}</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-transform"><RefreshCw size={20} className="inline-block mr-2" /> {t.retry || (language === 'ar' ? 'إعادة المحاولة' : 'Retry')}</button>
                        <button onClick={onClose} className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold hover:scale-105 transition-transform"> {t.close || (language === 'ar' ? 'إغلاق' : 'Close')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 backdrop-blur-[12px] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-500">
            {showQuiz && quizData && (
                <StoryQuiz 
                    quizData={quizData} 
                    lang={language} 
                    onClose={() => {
                        setShowQuiz(false);
                        onClose(); 
                    }}
                    onComplete={(score, total) => {
                         if (id && isAuthenticated) {
                            api.post(`/users/history/${id}/quiz`, { score, total }).catch(console.error);
                         } else if (id && !isAuthenticated) {
                            // Save locally for guests to sync later
                            localStorage.setItem('pending_quiz_result', JSON.stringify({
                                storyId: id,
                                score,
                                total,
                                timestamp: Date.now()
                            }));
                         }
                    }}
                />
            )}
            {/* Custom Magic Wand Cursor */}
            <style>{`
                .magic-cursor {
                    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236C63FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 4V2'/%3E%3Cpath d='M15 16v-2'/%3E%3Cpath d='M8 9h2'/%3E%3Cpath d='M20 9h2'/%3E%3Cpath d='M17.8 11.8 19 13'/%3E%3Cpath d='m3 21 9-9'/%3E%3Cpath d='M12.2 6.2 11 5'/%3E%3Cpath d='M12.2 11.8 11 13'/%3E%3C/svg%3E"), auto !important;
                }
            `}</style>

            <div
                ref={containerRef}
                className={`flex flex-col relative transition-all duration-500 magic-cursor 
                ${isMaximized ? 'fixed inset-0 w-full h-full bg-white/10 dark:bg-black/40' : 'w-full max-w-7xl h-[100vh] md:h-[90vh] bg-white/20 dark:bg-black/30 rounded-none md:rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-0 md:border border-white/20 dark:border-white/10 overflow-hidden'}`}
            >

                {/* Modern Header - Improved for Mobile */}
                <div className="absolute top-0 left-0 w-full flex flex-wrap justify-between items-center p-3 md:p-6 z-50 bg-gradient-to-b from-black/70 to-transparent pointer-events-none gap-2">
                    <div className="flex items-center gap-2 md:gap-4 pointer-events-auto shrink-0">
                        <div className="p-1.5 md:p-3 bg-white/20 dark:bg-black/40 rounded-xl md:rounded-2xl backdrop-blur-xl border border-white/30 shadow-lg">
                            <BookOpen className="text-white" size={window.innerWidth < 768 ? 18 : 28} />
                        </div>
                        <h2 className="text-white font-black text-sm md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight max-w-[120px] md:max-w-none truncate">{title}</h2>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto flex-wrap justify-end">
                        <div className="flex items-center bg-black/50 rounded-xl md:rounded-2xl p-0.5 md:p-1 border border-white/20 backdrop-blur-xl">
                            <button onClick={handleShare} className="p-1.5 md:p-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg md:rounded-xl transition-all" title={t.share}><Share2 size={18} className="md:w-5 md:h-5" /></button>
                            <button onClick={toggleNarrator} className={`p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all ${isSpeaking ? 'bg-primary text-white shadow-[0_0_20px_rgba(108,99,255,0.6)]' : 'text-gray-200 hover:text-white hover:bg-white/10'}`} title={t.narrator}>{isSpeaking ? <Square size={18} className="md:w-5 md:h-5" fill="currentColor" /> : <Play size={18} className="md:w-5 md:h-5" fill="currentColor" />}</button>
                            <button onClick={toggleMusic} className={`p-1.5 md:p-3 rounded-lg md:rounded-xl transition-all ${isMusicPlaying ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'text-gray-200 hover:text-white hover:bg-white/10'}`} title={t.music}><Music size={18} className={`md:w-5 md:h-5 ${isMusicPlaying ? "animate-pulse" : ""}`} /></button>
                        </div>

                        <div className="flex items-center bg-black/50 rounded-xl md:rounded-2xl p-0.5 md:p-1 border border-white/20 backdrop-blur-xl">
                            <button onClick={() => { const link = document.createElement('a'); link.href = pdfUrl; link.download = `${title}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} className="p-1.5 md:p-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg md:rounded-xl transition-all" title={t.download}><Download size={18} className="md:w-5 md:h-5" /></button>
                            <button onClick={toggleFullscreen} className="p-1.5 md:p-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg md:rounded-xl transition-all" title={t.zoom}>{isMaximized ? <Minimize2 size={18} className="md:w-5 md:h-5" /> : <Maximize2 size={18} className="md:w-5 md:h-5" />}</button>
                            <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 md:p-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg md:rounded-xl transition-all" title={t.mute}>{isMuted ? <VolumeX size={18} className="md:w-5 md:h-5" /> : <Volume2 size={18} className="md:w-5 md:h-5" />}</button>
                        </div>

                        <button onClick={onClose} className="p-1.5 md:p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl md:rounded-2xl transition-all shadow-lg ml-1" title={t.close}><X size={20} className="md:w-6 md:h-6" /></button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden pt-12 md:pt-16">
                    {showResumePrompt && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] animate-bounce-soft">
                            <button
                                onClick={() => {
                                    if (bookRef.current && savedProgress) {
                                        // Ensure we go to the EXACT saved page
                                        const targetPage = savedProgress.lastPageReached;
                                        // Using turnToPage for immediate jump instead of flip for animation
                                        if(bookRef.current.pageFlip()) {
                                            bookRef.current.pageFlip().turnToPage(targetPage);
                                            setPageIndex(targetPage); // Sync state
                                            setShowResumePrompt(false);
                                        }
                                    }
                                }}
                                className="px-6 py-3 bg-primary/90 text-white rounded-2xl font-bold shadow-2xl backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RefreshCw size={18} />
                                {language === 'ar' ? `أكمل من الصفحة ${savedProgress!.lastPageReached + 1}` : (language === 'fr' ? `Reprendre à la page ${savedProgress!.lastPageReached + 1}` : `Resume from page ${savedProgress!.lastPageReached + 1}`)}
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/20 backdrop-blur-sm">
                            <div className="relative">
                                <Loader2 className="animate-spin text-white mb-6" size={64} />
                                <div className="absolute inset-0 blur-xl bg-white/20 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-white text-2xl font-black animate-pulse drop-shadow-lg tracking-widest">{t.loadingStory}</p>
                        </div>
                    )}

                    {!isLoading && numPages > 0 && (
                        <div
                            className="flex items-center justify-center w-full h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                            style={{ transform: getBookTransform() }}
                        >
                            <HTMLFlipBook
                                width={bookDimensions.width}
                                height={bookDimensions.height}
                                size="fixed"
                                minWidth={250}
                                maxWidth={2500}
                                maxHeight={2500}
                                showCover={true}
                                mobileScrollSupport={true}
                                className="mx-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
                                ref={bookRef}
                                onFlip={onFlip}
                                showPageCorners={true}
                                useMouseEvents={true}
                                drawShadow={true}
                                flippingTime={1000}
                                startPage={0}
                                swipeDistance={30}
                                style={{ borderRadius: '12px', overflow: 'hidden' }}
                            >
                                {Array.from(new Array(numPages), (_, index) => (
                                    <PageWrapper key={index} number={index + 1}>
                                        {viewMode === 'images' && pages && pages[index] ? (
                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                <img src={pages[index]} alt={`Page ${index + 1}`} className="w-full h-full object-contain select-none" loading="lazy" />
                                            </div>
                                        ) : (
                                            Math.abs(pageIndex - index) <= 3 ? (
                                                <CanvasPage pageNumber={index + 1} renderPage={renderPage} isRendered={pagesRendered[index]} />
                                            ) : (
                                                <div className="w-full h-full bg-white" />
                                            )
                                        )}
                                    </PageWrapper>
                                ))}
                            </HTMLFlipBook>
                        </div>
                    )}

                    {/* Unified Navigation Controls: Fixed to be identical in AR/EN (Next on Right, Prev on Left) */}
                    {!isLoading && numPages > 0 && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:px-8 w-full z-50 pointer-events-none" dir="ltr">
                            {/* Previous Page Button (Always on Left) */}
                            <button
                                onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                className="pointer-events-auto p-2 md:p-6 bg-white/10 hover:bg-primary text-white rounded-xl md:rounded-3xl backdrop-blur-md transition-all shadow-xl group border border-white/20 active:scale-95"
                                title={t.prevPage}
                            >
                                <ChevronLeft size={window.innerWidth < 1024 ? 24 : 48} />
                            </button>

                            {/* Next Page Button (Always on Right) */}
                            <button
                                onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                className="pointer-events-auto p-2 md:p-6 bg-white/10 hover:bg-primary text-white rounded-xl md:rounded-3xl backdrop-blur-md transition-all shadow-xl group border border-white/20 active:scale-95"
                                title={t.nextPage}
                            >
                                <ChevronRight size={window.innerWidth < 1024 ? 24 : 48} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {!isLoading && numPages > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1.5 md:h-2 bg-white/5 backdrop-blur-sm flex overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(108,99,255,0.5)] origin-left"
                            style={{
                                width: `${((pageIndex + 1) / numPages) * 100}%`,
                                position: 'absolute',
                                left: 0
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};