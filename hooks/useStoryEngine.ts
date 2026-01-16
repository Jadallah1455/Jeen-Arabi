import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { savePageToCache, getPageFromCache } from '../utils/indexedDB';

// Configure Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface UseStoryEngineProps {
    pdfUrl: string;
    storyId: string;
    isMaximized: boolean;
}

export const useStoryEngine = ({ pdfUrl, storyId, isMaximized }: UseStoryEngineProps) => {
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [pagesRendered, setPagesRendered] = useState<boolean[]>([]);
    const [bookDimensions, setBookDimensions] = useState({ width: 400, height: 600 });

    // Memory Cache (Fastest)
    const memoryCache = useRef<Map<number, Blob>>(new Map());
    const flipSound = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        flipSound.current = new Audio('/sounds/page-flip.mp3');
        flipSound.current.volume = 0.5;
    }, []);

    const playFlipSound = useCallback((isMuted: boolean) => {
        if (!isMuted && flipSound.current) {
            flipSound.current.currentTime = 0;
            flipSound.current.play().catch(() => { });
        }
    }, []);

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            try {
                setIsLoading(true);
                setError(null);
                memoryCache.current.clear();

                const loadingTask = pdfjsLib.getDocument({
                    url: pdfUrl,
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                });

                const doc = await loadingTask.promise;

                // Calculate Dimensions
                const firstPage = await doc.getPage(1);
                const viewport = firstPage.getViewport({ scale: 1 });
                const aspectRatio = viewport.width / viewport.height;
                const maxHeight = window.innerHeight * 0.85;
                const calculatedHeight = Math.min(maxHeight, 800);
                const calculatedWidth = calculatedHeight * aspectRatio;

                setBookDimensions({ width: Math.floor(calculatedWidth), height: Math.floor(calculatedHeight) });
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setPagesRendered(new Array(doc.numPages).fill(false));
                setIsLoading(false);
            } catch (err: any) {
                console.error("Error loading PDF:", err);
                setError(err);
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [pdfUrl]);

    // Timeout fallback
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                if (isLoading) {
                    console.warn("PDF Load Timeout");
                    setIsLoading(false);
                    setError(new Error("Timeout loading PDF"));
                }
            }, 20000); // 20s timeout
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    const drawBlobToCanvas = (blob: Blob, canvas: HTMLCanvasElement) => {
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            }
        };
        img.src = URL.createObjectURL(blob);
    };

    const markPageAsRendered = (pageNumber: number) => {
        setPagesRendered(prev => {
            if (prev[pageNumber - 1]) return prev;
            const newStats = [...prev];
            newStats[pageNumber - 1] = true;
            return newStats;
        });
    };

    // Render Page Logic
    const renderPage = useCallback(async (pageNumber: number, canvas: HTMLCanvasElement) => {
        if (!pdfDoc || !canvas) return;

        // 1. Check Memory Cache
        if (memoryCache.current.has(pageNumber)) {
            const blob = memoryCache.current.get(pageNumber);
            if (blob) drawBlobToCanvas(blob, canvas);
            return;
        }

        // 2. Check IndexedDB Cache
        try {
            const cachedBlob = await getPageFromCache(storyId, pageNumber);
            if (cachedBlob) {
                memoryCache.current.set(pageNumber, cachedBlob); // Promote to memory
                drawBlobToCanvas(cachedBlob, canvas);
                markPageAsRendered(pageNumber);
                return;
            }
        } catch (e) {
            console.warn('IndexedDB read error', e);
        }

        // 3. Render Fresh
        const isMobile = window.innerWidth < 600;
        const scale = isMaximized ? 2.0 : (isMobile ? 1.0 : 1.5);

        try {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const context = canvas.getContext('2d');

            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await new Promise<void>(resolve => {
                    requestAnimationFrame(async () => {
                        await page.render(renderContext).promise;

                        canvas.toBlob((blob) => {
                            if (blob) {
                                memoryCache.current.set(pageNumber, blob);
                                savePageToCache(storyId, pageNumber, blob); // Save to IndexedDB
                            }
                        });

                        resolve();
                    });
                });

                markPageAsRendered(pageNumber);
            }
        } catch (err) {
            console.error(`Error rendering page ${pageNumber}:`, err);
        }
    }, [pdfDoc, isMaximized, storyId]);

    const pagesArray = useMemo(() => Array.from({ length: numPages }, (_, i) => i), [numPages]);

    return {
        pdfDoc,
        numPages,
        isLoading,
        error,
        bookDimensions,
        pagesRendered,
        pagesArray,
        renderPage,
        playFlipSound
    };
};
