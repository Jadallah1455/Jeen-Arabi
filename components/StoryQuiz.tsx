import React, { useState } from 'react';
import { CheckCircle, XCircle, Award, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

// Sound Effects using Web Audio API
const playSound = (type: 'correct' | 'wrong' | 'success' | 'fail') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'correct') {
        // Happy ascending chime
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'wrong') {
        // Error descending tone
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'success') {
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.45); // C6
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    } else if (type === 'fail') {
        // Sad descending tone
        oscillator.frequency.setValueAtTime(392, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
};

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number; // 0-indexed index of correct option
}

interface StoryQuizProps {
    quizData: QuizQuestion[];
    onClose: () => void;
    onComplete: (score: number, total: number) => void;
    lang: 'ar' | 'en' | 'fr';
}

export const StoryQuiz: React.FC<StoryQuizProps> = ({ quizData, onClose, onComplete, lang }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const isRTL = lang === 'ar';
    const t = {
        quizTitle: { ar: 'اختبار القصة', en: 'Story Quiz', fr: 'Quiz de l\'histoire' },
        next: { ar: 'التالي', en: 'Next', fr: 'Suivant' },
        finish: { ar: 'إنهاء', en: 'Finish', fr: 'Terminer' },
        correct: { ar: 'إجابة صحيحة! 🎉', en: 'Correct! 🎉', fr: 'Correct! 🎉' },
        wrong: { ar: 'حاول مرة أخرى 😅', en: 'Oops, wrong answer 😅', fr: 'Oups, mauvaise réponse 😅' },
        score: { ar: 'نتيجتك:', en: 'Your Score:', fr: 'Votre Score:' },
        playAgain: { ar: 'العب مرة أخرى', en: 'Play Again', fr: 'Jouer à nouveau' },
        close: { ar: 'خروج', en: 'Close', fr: 'Fermer' }
    };

    const handleOptionClick = (index: number) => {
        if (showFeedback) return;
        setSelectedOption(index);
        setShowFeedback(true);

        const isCorrect = index === quizData[currentQuestion].correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
            playSound('correct'); // ✨ Play success sound
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        } else {
            playSound('wrong'); // ✨ Play error sound
        }
    };

    const handleNext = () => {
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            setIsCompleted(true);
            const finalScore = selectedOption === quizData[currentQuestion].correctAnswer ? score + 1 : score;
            const percentage = (finalScore / quizData.length) * 100;
            
            onComplete(finalScore, quizData.length);
            
            // ✨ Play result sound based on percentage
            if (percentage >= 50) {
                playSound('success');
            } else {
                playSound('fail');
            }
            
            if (finalScore === quizData.length) {
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const interval: any = setInterval(() => {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) return clearInterval(interval);
                    confetti({ particleCount: 50, origin: { x: Math.random(), y: Math.random() - 0.2 } });
                }, 250);
            }
        }
    };

    if (isCompleted) {
        const canSavePoints = !useAuth().isAuthenticated;
        
        return (
            <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl p-8 text-center shadow-2xl border-4 border-yellow-400"
                >
                    <Award size={80} className="mx-auto text-yellow-500 mb-6 animate-bounce" />
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {score === quizData.length ? (lang === 'ar' ? '🌟 رائع جداً! 🌟' : '🌟 SUPER! 🌟') : (lang === 'ar' ? 'عمل جيد! 👍' : 'Good Job! 👍')}
                    </h2>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-4">
                        {t.score[lang]} <span className="text-primary">{score} / {quizData.length}</span>
                    </p>

                    {canSavePoints && (
                        <div className="mb-8 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                            <p className="text-primary font-bold mb-4">
                                {lang === 'ar' 
                                    ? 'سجل دخولك الآن لحفظ هذه النقاط في رصيدك!' 
                                    : 'Sign in now to save these points to your account!'}
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a 
                                    href="/login"
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20"
                                >
                                    {lang === 'ar' ? 'دخول' : 'Login'}
                                </a>
                                <a 
                                    href="/register"
                                    className="px-4 py-2 bg-white dark:bg-gray-800 text-primary border border-primary rounded-lg text-sm font-bold"
                                >
                                    {lang === 'ar' ? 'حساب جديد' : 'Register'}
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => {
                                setIsCompleted(false);
                                setCurrentQuestion(0);
                                setScore(0);
                                setSelectedOption(null);
                                setShowFeedback(false);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200"
                        >
                            <RefreshCw size={20} /> {t.playAgain[lang]}
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/30"
                        >
                            <XCircle size={20} /> {t.close[lang]}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const question = quizData[currentQuestion];

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
                key={currentQuestion}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-100 dark:bg-gray-800">
                    <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-8 mt-2">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        Question {currentQuestion + 1} of {quizData.length}
                    </span>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <XCircle size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Question */}
                <h3 className={`text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-8 leading-tight ${isRTL ? 'text-right font-arabic' : 'text-left'}`}>
                    {question.question}
                </h3>

                {/* Options */}
                <div className="grid gap-4 mb-8">
                    {question.options.map((option, idx) => {
                        let statusClass = "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-primary/50";
                        if (showFeedback) {
                            if (idx === question.correctAnswer) statusClass = "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-300";
                            else if (idx === selectedOption) statusClass = "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-300";
                            else statusClass = "opacity-50 grayscale";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionClick(idx)}
                                disabled={showFeedback}
                                className={`p-4 md:p-6 rounded-2xl text-lg font-bold transition-all text-left flex justify-between items-center ${statusClass} ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                            >
                                <span>{option}</span>
                                {showFeedback && idx === question.correctAnswer && <CheckCircle className="text-green-500" />}
                                {showFeedback && idx === selectedOption && idx !== question.correctAnswer && <XCircle className="text-red-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* Footer / Next Button */}
                <div className="h-16 flex items-center justify-center">
                    <AnimatePresence>
                        {showFeedback && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                onClick={handleNext}
                                className={`flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {currentQuestion < quizData.length - 1 ? t.next[lang] : t.finish[lang]}
                                {isRTL ? <ArrowLeft /> : <ArrowRight />}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};
