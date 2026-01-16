import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Language, DesignElement } from '../types';
import { TRANSLATIONS, STICKERS } from '../constants';
import { generateStoryFromDesign } from '../services/geminiService';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Wand2,
  Image as ImageIcon,
  Type,
  Download,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Pencil,
  Eraser,
  Palette,
  PenTool,
  Move,
  X,
  Undo,
  Redo,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';

/**
 * DesignStudio.tsx
 * نسخة محسّنة من صفحة صنع القصص:
 * - إصلاحات CSS (px spacing)
 * - سحب عبر Pointer API (يدعم الماوس واللمس)
 * - حركة سلسّة بدون إعادة رندر لكل فريم (نستخدم DOM transform أثناء السحب ثم نحفظ الوضع النهائي في state عند انتهائه)
 * - عناصر مُعزّزة كمكون memo لتقليل إعادة التصيير
 * - تحسين PDF export (batch delay، scale أقل، تنظيف URLs)
 * - تحسينات صغيرة في الرسم، إضافة undo/redo عبر ReactSketchCanvas (اللي يدعمه)
 */

/* ---------- Types ---------- */

interface DesignStudioProps {
  lang: Language;
}

interface StoryPage {
  id: string;
  elements: DesignElement[];
}

/* ---------- Helpers ---------- */

const genId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;

/* ---------- StoryElement: memoized display component ---------- */
const StoryElement: React.FC<{
  el: DesignElement;
  onMouseDown: (e: React.PointerEvent, id: string, x: number, y: number, scale: number) => void;
  onDelete: (id: string) => void;
  deleteTitle: string;
}> = React.memo(({ el, onMouseDown, onDelete, deleteTitle }) => {
  return (
    <div
      // ملحوظة: نستخدم style inline مع left/top بصيغة صحيحة (no spaces)
      className={`absolute select-none`}
      data-elid={el.id}
      style={{
        left: `${el.x}px`,
        top: `${el.y}px`,
        transform: el.scale ? `scale(${el.scale})` : undefined,
        zIndex: el.zIndex ?? 10,
        touchAction: 'none', // ضروري للـ pointer events على اللمس
      }}
      onPointerDown={(e) => onMouseDown(e, el.id, el.x, el.y, el.scale || 1)}
    >
      {el.type === 'sticker' && (
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>{el.content}</span>
      )}
      {el.type === 'text' && (
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-200 shadow-sm min-w-[50px]">
          <p className="text-xl font-bold text-gray-800 font-comic">{el.content}</p>
        </div>
      )}
      {el.type === 'image' && (
        // pointer-events none حتى لا نمنع التقاط العنصر نفسه (نريد التقاط الحاوية)
        <img src={el.content} alt="drawing" className="w-48 h-auto object-contain pointer-events-none" />
      )}

      {/* زر الحذف (نظهره دائماً لأن الأطفال قد يحتاجون لمسح سريع) */}
      <button
        onPointerDown={(e) => e.stopPropagation()} // منع بدء السحب عند الضغط على الزر
        onClick={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          onDelete(el.id);
        }}
        className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors z-[1000]"
        aria-label="delete-element"
        title={deleteTitle}
      >
        <X size={12} />
      </button>
    </div>
  );
});
StoryElement.displayName = 'StoryElement';

/* ---------- Main Component ---------- */

export const DesignStudio: React.FC<DesignStudioProps> = ({ lang }) => {
  const { isAuthenticated } = useAuth();
  const t = TRANSLATIONS[lang].design;

  // Story State
  const [pages, setPages] = useState<StoryPage[]>([{ id: genId('page'), elements: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // UI State
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Refs
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sketchRef = useRef<ReactSketchCanvasRef | null>(null);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging internals kept in refs so updates don't rerender whole list
  const draggingRef = useRef<{
    id: string | null;
    startPointerX: number;
    startPointerY: number;
    lastPointerX: number; // Track last known position
    lastPointerY: number;
    startElX: number;
    startElY: number;
    startScale: number;
    node?: HTMLElement | null;
  }>({ id: null, startPointerX: 0, startPointerY: 0, lastPointerX: 0, lastPointerY: 0, startElX: 0, startElY: 0, startScale: 1, node: null });

  // map of element DOM nodes to apply transform directly
  const elNodeMap = useRef<Map<string, HTMLElement>>(new Map());

  const currentPage = pages[currentPageIndex];

  /* ---------------- Page Management ---------------- */

  const addNewPage = useCallback(() => {
    const newPage = { id: genId('page'), elements: [] };
    setPages((p) => {
      const np = [...p, newPage];
      setCurrentPageIndex(np.length - 1);
      return np;
    });
  }, []);

  const deletePage = useCallback((index: number) => {
    if (pages.length === 1) {
      toast.error(t.toastMinPage);
      return;
    }
    setPages((prev) => {
      const newPages = prev.filter((_, i) => i !== index);
      if (index <= currentPageIndex && currentPageIndex > 0) {
        setCurrentPageIndex((ci) => Math.max(0, ci - 1));
      }
      return newPages;
    });
  }, [pages.length, currentPageIndex, t.toastMinPage]);

  const updateCurrentPageElements = useCallback((newElements: DesignElement[]) => {
    setPages((prev) => prev.map((p, i) => i === currentPageIndex ? { ...p, elements: newElements } : p));
  }, [currentPageIndex]);

  /* ---------------- Element Management ---------------- */

  const addElement = useCallback((type: DesignElement['type'], content: string) => {
    // مكان إضافة ذكي: داخل حدود الـ canvas
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const defaultX = canvasRect ? Math.max(10, Math.floor(canvasRect.width / 4)) : 100;
    const defaultY = canvasRect ? Math.max(10, Math.floor(canvasRect.height / 4)) : 100;

    const newElement: DesignElement = {
      id: genId('el'),
      type,
      content,
      x: defaultX,
      y: defaultY,
      scale: 1,
      zIndex: 10,
    };
    updateCurrentPageElements([...currentPage.elements, newElement]);
  }, [currentPage.elements, updateCurrentPageElements]);

  const removeElement = useCallback((id: string) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== currentPageIndex) return p;
      return { ...p, elements: p.elements.filter(e => e.id !== id) };
    }));
    // clean node map
    elNodeMap.current.delete(id);
  }, [currentPageIndex]);

  const handleAddText = useCallback(() => {
    if (textInput.trim()) {
      addElement('text', textInput.trim());
      setTextInput('');
      setShowTextModal(false);
    }
  }, [addElement, textInput]);

  /* ---------------- Drawing Handlers ---------------- */

  const handleSaveDrawing = useCallback(async () => {
    if (sketchRef.current) {
      try {
        const dataUrl = await sketchRef.current.exportImage('png');
        // dataUrl is base64 image
        addElement('image', dataUrl);
        setShowDrawingModal(false);
        toast.success(t.toastDrawingAdded);
      } catch (err) {
        console.error(err);
        toast.error(t.toastDrawingFail);
      }
    }
  }, [addElement, t.toastDrawingAdded, t.toastDrawingFail]);

  /* ---------------- AI Story Generation ---------------- */

  const handleGenerateStory = useCallback(async () => {
    if (!title && currentPage.elements.length === 0) {
      toast.error(t.toastNeedContent);
      return;
    }
    setIsGenerating(true);
    setGeneratedStory('');

    try {
      // نأخذ أسماء الملصقات من كل الصفحات
      const allStickers = pages.flatMap(p => p.elements)
        .filter(el => el.type === 'sticker')
        .map(el => {
          const found = STICKERS.find(s => s.icon === el.content);
          return found ? found.name : 'Object';
        });

      const story = await generateStoryFromDesign(title || (lang === 'ar' ? 'قصة بدون عنوان' : 'Untitled'), allStickers, lang);
      setGeneratedStory(story);
    } catch (err) {
      console.error(err);
      toast.error(t.toastAiFail);
    } finally {
      setIsGenerating(false);
    }
  }, [title, pages, lang, t.toastAiFail]);

  /* ---------------- Drag & Drop (Pointer API) ----------------
     الفكرة:
     - عند pointerdown نأخذ العنصر ونبدأ الإمساك به (setPointerCapture)
     - أثناء الحركة نطبق transform مباشرة على الـ DOM node لتجنب re-renders
     - عند pointerup نحسب الموضع النهائي ونخزن في state
  ---------------- */

  const onElementPointerDown = useCallback((e: React.PointerEvent, id: string, x: number, y: number, scale: number) => {
    e.stopPropagation();
    e.preventDefault(); // منع التحديد أو السكرول
    const elNode = (e.currentTarget as HTMLElement);

    // pointer capture
    try { elNode.setPointerCapture(e.pointerId); } catch { /*noop*/ }

    draggingRef.current = {
      id,
      node: elNode,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      lastPointerX: e.clientX, // Initialize last position
      lastPointerY: e.clientY,
      startElX: x,
      startElY: y,
      startScale: scale || 1
    };

    // add to map
    elNodeMap.current.set(id, elNode);

    // add dragging style
    elNode.style.transition = 'none'; // تعطيل الانتقالات فوراً
    elNode.style.willChange = 'transform, left, top';
    elNode.style.zIndex = '9999';
    elNode.style.cursor = 'grabbing';

  }, []);

  const onPointerMoveWindow = useCallback((ev: PointerEvent) => {
    const dr = draggingRef.current;
    if (!dr.id || !dr.node) return;

    ev.preventDefault();

    // Update last known position
    dr.lastPointerX = ev.clientX;
    dr.lastPointerY = ev.clientY;

    // compute displacement
    const dx = ev.clientX - dr.startPointerX;
    const dy = ev.clientY - dr.startPointerY;

    // apply transform directly
    // نحافظ على المقياس أثناء السحب
    dr.node.style.transform = `translate(${dx}px, ${dy}px) scale(${dr.startScale})`;
  }, []);

  const onPointerUpWindow = useCallback((ev?: PointerEvent) => {
    const dr = draggingRef.current;
    if (!dr.id || !dr.node) return;

    // Use last known position if ev is missing or for consistency
    // This prevents "snap back" if pointerup fires with 0 or weird coordinates
    const currentX = ev?.clientX || dr.lastPointerX;
    const currentY = ev?.clientY || dr.lastPointerY;

    // compute final displacement
    const dx = currentX - dr.startPointerX;
    const dy = currentY - dr.startPointerY;

    const finalX = dr.startElX + dx;
    const finalY = dr.startElY + dy;

    // commit to state
    // نستخدم دالة تحديث الحالة للبحث عن الصفحة الصحيحة وتحديث العنصر فيها
    setPages(prev => prev.map(p => {
      // Update element in ANY page (though usually current)
      const hasElement = p.elements.some(el => el.id === dr.id);
      if (!hasElement) return p;

      return {
        ...p,
        elements: p.elements.map(el => el.id === dr.id ? {
          ...el,
          x: Math.round(finalX),
          y: Math.round(finalY)
        } : el)
      };
    }));

    // cleanup DOM
    try {
      dr.node.style.transform = '';
      dr.node.style.transition = '';
      dr.node.style.willChange = '';
      dr.node.style.zIndex = '';
      dr.node.style.cursor = '';
    } catch { /* noop */ }

    // release pointer capture
    try { if (ev?.pointerId && dr.node) dr.node.releasePointerCapture(ev.pointerId); } catch { /* noop */ }

    draggingRef.current = { id: null, node: null, startPointerX: 0, startPointerY: 0, lastPointerX: 0, lastPointerY: 0, startElX: 0, startElY: 0, startScale: 1 };
  }, []);

  useEffect(() => {
    // attach global pointer listeners to track pointer outside the element too
    window.addEventListener('pointermove', onPointerMoveWindow);
    window.addEventListener('pointerup', onPointerUpWindow);
    window.addEventListener('pointercancel', onPointerUpWindow); // Handle cancel same as up
    return () => {
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('pointerup', onPointerUpWindow);
      window.removeEventListener('pointercancel', onPointerUpWindow);
    };
  }, [onPointerMoveWindow, onPointerUpWindow]);

  /* ---------------- Download Handler (PDF improved) ---------------- */

  const handleDownloadPDF = useCallback(async () => {
    const toastId = toast.loading(t.toastGeneratingPdf || 'Generating PDF...');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Cover
      pdf.setFontSize(30);
      pdf.text(title || (lang === 'ar' ? 'قصتي' : 'My Story'), pdfWidth / 2, 40, { align: 'center' });
      if (authorName) {
        pdf.setFontSize(18);
        pdf.text(t.pdfWrittenBy || (lang === 'ar' ? 'من إعداد' : 'Written by'), pdfWidth / 2, 60, { align: 'center' });
        pdf.setFontSize(22);
        pdf.text(authorName, pdfWidth / 2, 75, { align: 'center' });
      }

      // Story page (AI)
      if (generatedStory) {
        pdf.addPage();
        pdf.setFontSize(14);
        const splitText = pdf.splitTextToSize(generatedStory, pdfWidth - 40);
        pdf.text(splitText, 20, 20);
      }

      // Render each visual page from exportContainerRef
      if (exportContainerRef.current) {
        const pageDivs = Array.from(exportContainerRef.current.children) as HTMLElement[];
        for (let i = 0; i < pageDivs.length; i++) {
          const pageDiv = pageDivs[i];
          // small delay to keep UI responsive for large pages
          await new Promise(res => setTimeout(res, 80));

          // use scale 1.5 to reduce memory usage but keep quality
          const canvas = await html2canvas(pageDiv, { scale: 1.5, useCORS: true, allowTaint: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const imgHeight = (imgProps.height * (pdfWidth - 40)) / imgProps.width;

          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth - 40, imgHeight);
          pdf.setFontSize(10);
          pdf.text(`${t.pdfPage || 'Page'} ${i + 1}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
        }
      }

      pdf.save(`${(title || 'story').replace(/\s+/g, '_')}.pdf`);
      toast.success(t.toastPdfDownloaded || 'PDF downloaded', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(t.toastPdfFailed || 'PDF generation failed', { id: toastId });
    }
  }, [title, authorName, generatedStory, t, lang]);
  /* ---------------- Save to Backend ---------------- */
  const handleSaveDesign = async () => {
    if (!isAuthenticated) {
      toast.error(t.loginToSave);
      return;
    }

    if (!title) {
      toast.error(t.enterTitle);
      return;
    }

    const toastId = toast.loading(t.savingDesign);

    try {
      // Capture first page for preview
      let previewImage = '';
      if (canvasRef.current) {
        const canvas = await html2canvas(canvasRef.current, { scale: 0.5 });
        previewImage = canvas.toDataURL('image/jpeg', 0.5);
      }

      await api.post('/users/designs', {
        title,
        authorName,
        content: { pages },
        generatedStory,
        previewImage
      });

      toast.success(t.saveDesignSuccess, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(t.saveDesignFail, { id: toastId });
    }
  };

  /* ---------------- Utility: add sticker list ---------------- */

  const stickerButtons = useMemo(() => STICKERS.map(sticker => (
    <button
      key={sticker.id}
      onClick={() => addElement('sticker', sticker.icon)}
      className="aspect-square bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded-lg text-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
    >
      {sticker.icon}
    </button>
  )), [addElement]);

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title={t.title}
        description={TRANSLATIONS[lang].seo.design.description}
        keywords={TRANSLATIONS[lang].seo.design.keywords}
        lang={lang}
      />

      <div className="max-w-7xl mx-auto min-h-[calc(100vh-100px)] pt-20 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {title || t.untitled}
            </h3>
            <p className={`text-gray-500 dark:text-gray-400`}>
              {t.subtitle}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowDrawingModal(true)}
              className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <PenTool size={18} />
              {t.draw}
            </button>
            <button
              onClick={handleSaveDesign}
              className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <Save size={18} />
              {t.saveToProfile}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <Download size={18} />
              {t.exportPdf}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Tools */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 dark:text-white">{t.storyDetails}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.placeholderTitle}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={t.authorName}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 dark:text-white">{t.addElements}</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setShowTextModal(true)} className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl hover:bg-blue-100 transition-colors">
                  <Type size={24} />
                  <span className="text-xs font-bold mt-1">{t.addText}</span>
                </button>
                <button onClick={() => setShowDrawingModal(true)} className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors">
                  <PenTool size={24} />
                  <span className="text-xs font-bold mt-1">{t.draw}</span>
                </button>
              </div>

              <h4 className="text-sm font-bold text-gray-500 mb-2">{t.stickers}</h4>
              <div className="grid grid-cols-4 gap-2">
                {stickerButtons}
              </div>
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isGenerating ? <span>{t.generatingBtn}</span> : <><Wand2 size={20} /> {t.generate}</>}
            </button>
          </div>

          {/* Center: Canvas */}
          <div className="lg:col-span-9 space-y-4">
            {/* Page Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-dark-card p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-bold dark:text-white">{t.page || 'Page'} {currentPageIndex + 1} {t.of || 'of'} {pages.length}</span>
                <button
                  onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex === pages.length - 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deletePage(currentPageIndex)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                  <Trash2 size={16} /> {t.deletePage}
                </button>
                <button onClick={addNewPage} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> {t.newPage}
                </button>
              </div>
            </div>

            {/* The Canvas */}
            <div
              ref={canvasRef}
              className="relative aspect-[16/9] bg-white rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-crosshair"
              // pointer events handled on children - but also allow clearing selection on canvas click
              onPointerDown={() => { /* click on canvas clears selection in future */ }}
            >
              {/* background grid for kid-friendly feel */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {/* Elements */}
              {currentPage.elements.map((el) => (
                <div
                  key={el.id}
                  // wrapper lets StoryElement be memoized and we still attach a ref
                  ref={(node) => { if (node) elNodeMap.current.set(el.id, node); else elNodeMap.current.delete(el.id); }}
                >
                  <StoryElement
                    el={el}
                    onMouseDown={onElementPointerDown}
                    onDelete={removeElement}
                    deleteTitle={t.delete}
                  />
                </div>
              ))}

              {/* Empty hint */}
              {currentPage.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                  <div className="text-center">
                    <Move size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xl font-bold">{t.startDesigning}</p>
                    <p className="text-sm">{t.dragStickers}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Story Text */}
            {generatedStory && (
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 animate-slide-up">
                <h3 className="font-bold text-lg mb-2 dark:text-white">{t.aiStory}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{generatedStory}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Container for PDF Export */}
      <div ref={exportContainerRef} style={{ position: 'absolute', top: -10000, left: -10000 }}>
        {pages.map((page) => (
          <div key={page.id} className="bg-white relative overflow-hidden" style={{ width: '800px', height: '450px' }}>
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            {page.elements.map((el) => (
              <div key={el.id} className="absolute" style={{ left: `${el.x}px`, top: `${el.y}px`, zIndex: el.zIndex ?? 10 }}>
                {el.type === 'sticker' && <span style={{ fontSize: '4rem' }}>{el.content}</span>}
                {el.type === 'text' && (
                  <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-200 shadow-sm min-w-[50px]">
                    <p className="text-xl font-bold text-gray-800 font-comic">{el.content}</p>
                  </div>
                )}
                {el.type === 'image' && <img src={el.content} alt="drawing" className="w-48 h-auto object-contain" />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Drawing Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-xl dark:text-white">{t.drawingPad}</h3>
              <button onClick={() => setShowDrawingModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X /></button>
            </div>

            <div className="flex-1 relative bg-white cursor-crosshair">
              <ReactSketchCanvas
                ref={sketchRef}
                strokeWidth={brushSize}
                strokeColor={isEraser ? '#FFFFFF' : drawingColor}
                canvasColor="transparent"
                style={{ border: 'none', width: '100%', height: '100%' }}
              />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map(color => (
                    <button
                      key={color}
                      onClick={() => { setDrawingColor(color); setIsEraser(false); }}
                      className={`w-8 h-8 rounded-full border-2 ${drawingColor === color && !isEraser ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`color-${color}`}
                    />
                  ))}
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEraser(!isEraser)} className={`p-2 rounded-lg ${isEraser ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Eraser">
                    <Eraser size={20} />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex gap-1">
                  <button onClick={() => sketchRef.current?.undo()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Undo size={20} /></button>
                  <button onClick={() => sketchRef.current?.redo()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Redo size={20} /></button>
                  <button onClick={() => sketchRef.current?.clearCanvas()} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 size={20} /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  // export small preview
                  (async () => {
                    try {
                      const img = await sketchRef.current?.exportImage('png');
                      toast.success(t.previewReady);
                    } catch { /* noop */ }
                  })();
                }} className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">{t.preview}</button>

                <button
                  onClick={handleSaveDrawing}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                  <Save size={18} /> {t.addToStory}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-xl dark:text-white">{t.addText}</h3>
              <button
                onClick={() => { setShowTextModal(false); setTextInput(''); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.enterText}</label>
              <textarea
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-all dark:text-white h-32 resize-none text-lg font-bold"
                placeholder={lang === 'ar' ? 'اكتب شيئاً...' : 'Type something...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddText();
                  }
                }}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={() => { setShowTextModal(false); setTextInput(''); }}
                className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};