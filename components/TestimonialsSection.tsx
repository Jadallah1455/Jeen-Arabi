import React, { useState, useEffect } from 'react';
import { Quote, MessageCircleHeart } from 'lucide-react';
import { getPlatformReviews, Review } from '../services/reviewService';
import { getAvatarData } from '../constants/avatars';
import { Language } from '../types';

interface TestimonialsSectionProps {
    lang: Language;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ lang }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await getPlatformReviews();
                setReviews(data);
            } catch (error) {
                console.error('Failed to fetch testimonials:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading || reviews.length === 0) return null;

    // Distribute reviews across 3 columns
    const column1 = reviews.filter((_, i) => i % 3 === 0);
    const column2 = reviews.filter((_, i) => i % 3 === 1);
    const column3 = reviews.filter((_, i) => i % 3 === 2);

    const renderReview = (review: Review) => {
        const avatar = review.guestAvatar ? getAvatarData(review.guestAvatar) : null;
        const displayName = review.userName || review.User?.username || 'Anonymous';

        return (
            <div
                key={review.id}
                className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg mb-6 relative"
            >
                <Quote className="absolute top-4 right-4 text-primary/20" size={32} />
                
                <div className="flex items-center gap-4 mb-4">
                    {/* Avatar */}
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                        style={{ backgroundColor: avatar?.color || '#6366f1' }}
                    >
                        {avatar?.emoji || '👤'}
                    </div>
                    
                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white">{displayName}</h4>
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className={`text-sm ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    "{review.comment}"
                </p>
            </div>
        );
    };

    return (
        <div className="py-20 bg-gray-50 dark:bg-dark-bg overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {lang === 'ar' ? 'آراء عملائنا' : lang === 'fr' ? 'Avis de Nos Clients' : 'Hear from Our Users'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {lang === 'ar'
                            ? 'اكتشف ما يقوله الآباء والأطفال عن جين عربي'
                            : lang === 'fr'
                            ? 'Découvrez ce que les parents et les enfants disent de Jeen Arabi'
                            : 'Discover what parents and children say about Jeen Arabi'
                        }
                    </p>
                </div>

                {/* 3 Column Animated Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {/* Column 1 - Scrolls Up */}
                    <div className="testimonials-column column-1">
                        <div className="testimonials-track">
                            {column1.concat(column1).map((review, idx) => (
                                <div key={`col1-${idx}`}>
                                    {renderReview(review)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2 - Scrolls Down */}
                    <div className="testimonials-column column-2">
                        <div className="testimonials-track">
                            {column2.concat(column2).map((review, idx) => (
                                <div key={`col2-${idx}`}>
                                    {renderReview(review)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 3 - Scrolls Up (Slower) */}
                    <div className="testimonials-column column-3">
                        <div className="testimonials-track">
                            {column3.concat(column3).map((review, idx) => (
                                <div key={`col3-${idx}`}>
                                    {renderReview(review)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                .testimonials-column {
                    overflow: hidden;
                    max-height: 600px;
                    position: relative;
                }

                .testimonials-track {
                    display: flex;
                    flex-direction: column;
                }

                /* Column 1 - Scrolls up (faster) */
                .column-1 .testimonials-track {
                    animation: scroll-up 15s linear infinite;
                }

                /* Column 2 - Scrolls down (medium) */
                .column-2 .testimonials-track {
                    animation: scroll-down 18s linear infinite;
                }

                /* Column 3 - Scrolls up (slower) */
                .column-3 .testimonials-track {
                    animation: scroll-up 20s linear infinite;
                }

                /* Pause on hover */
                .testimonials-column:hover .testimonials-track {
                    animation-play-state: paused;
                }

                @keyframes scroll-up {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(-50%);
                    }
                }

                @keyframes scroll-down {
                    0% {
                        transform: translateY(-50%);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }

                /* Mobile: Single column, no animation */
                @media (max-width: 768px) {
                    .testimonials-column .testimonials-track {
                        animation: none !important;
                    }
                    
                    .testimonials-column {
                        max-height: none;
                    }
                }
            `}</style>

            {/* CTA Button to Add Review */}
            <div className="text-center mt-12">
                <a
                    href="/support#write-review"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all"
                >
                    <MessageCircleHeart size={20} />
                    {lang === 'ar' ? 'أخبرنا برأيك' : lang === 'fr' ? 'Partagez votre avis' : 'Share Your Opinion'}
                </a>
            </div>
        </div>
    );
};
