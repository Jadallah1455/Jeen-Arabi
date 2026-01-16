import React from 'react';

export const FloatingShapes: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Stars */}
            <div className="absolute top-20 left-10 animate-float" style={{ animationDelay: '0s' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-yellow-400/30">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
            </div>

            <div className="absolute top-1/4 right-16 animate-float" style={{ animationDelay: '2s' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-purple-400/20">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
            </div>

            {/* Circles */}
            <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-pink-400/10 to-purple-400/10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 animate-float" style={{ animationDelay: '3s' }}></div>

            {/* Hearts */}
            <div className="absolute bottom-20 left-1/3 animate-float-rotate" style={{ animationDelay: '1.5s' }}>
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none" className="text-red-400/20">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
                </svg>
            </div>

            {/* Books */}
            <div className="absolute top-1/2 right-10 animate-float" style={{ animationDelay: '2.5s' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-400/20">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor"/>
                </svg>
            </div>

            {/* Sparkles */}
            <div className="absolute top-40 right-1/3 animate-twinkle" style={{ animationDelay: '0.5s' }}>
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" className="text-yellow-300/30">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                </svg>
            </div>

            <div className="absolute bottom-1/3 left-20 animate-twinkle" style={{ animationDelay: '4s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-indigo-300/25">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                </svg>
            </div>

            {/* Clouds */}
            <div className="absolute top-10 right-1/4 animate-drift" style={{ animationDelay: '0s' }}>
                <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-blue-200/15">
                    <path d="M50 20C50 11.716 43.284 5 35 5C30.408 5 26.328 7.144 23.72 10.464C22.62 10.164 21.464 10 20.264 10C13.904 10 8.736 15.168 8.736 21.528C3.68 22.52 0 27.056 0 32.472C0 38.576 4.92 43.496 11.024 43.496H46.024C53.744 43.496 60 37.24 60 29.52C60 23.52 55.92 18.52 50.504 16.776L50 20Z" fill="currentColor"/>
                </svg>
            </div>

            {/* Rainbow */}
            <div className="absolute bottom-10 right-20 animate-float" style={{ animationDelay: '3.5s' }}>
                <svg width="50" height="30" viewBox="0 0 50 30" fill="none">
                    <path d="M5 25C5 14.507 13.507 6 24 6C34.493 6 43 14.507 43 25" stroke="url(#rainbow)" strokeWidth="4" strokeLinecap="round"/>
                    <defs>
                        <linearGradient id="rainbow" x1="5" y1="6" x2="43" y2="6">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)"/>
                            <stop offset="33%" stopColor="rgba(251, 191, 36, 0.2)"/>
                            <stop offset="66%" stopColor="rgba(34, 197, 94, 0.2)"/>
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.2)"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px);
                    }
                }

                @keyframes float-rotate {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-25px) rotate(180deg);
                    }
                }

                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.1;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.2;
                    }
                }

                @keyframes drift {
                    0% {
                        transform: translateX(0px);
                    }
                    100% {
                        transform: translateX(100px);
                    }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-float-rotate {
                    animation: float-rotate 8s ease-in-out infinite;
                }

                .animate-twinkle {
                    animation: twinkle 3s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 5s ease-in-out infinite;
                }

                .animate-drift {
                    animation: drift 20s linear infinite;
                }
            `}</style>
        </div>
    );
};
