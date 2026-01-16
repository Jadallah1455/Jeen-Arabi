import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { createReview } from '../services/reviewService';
import { GUEST_AVATARS, getAvatarData } from '../constants/avatars';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    lang: Language;
    storyId?: string;
    type: 'story' | 'platform';
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    lang,
    storyId,
    type,
    isOpen,
    onClose,
    isLoggedIn
}) => {
    const isRTL = lang === 'ar';
    const t = TRANSLATIONS[lang];
    const reviewText = (t as any).reviews || {};

    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [guestName, setGuestName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(GUEST_AVATARS[0].id);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            toast.error(lang === 'ar' ? 'يرجى تحديد تقييمك' : 'Please select a rating');
            return;
        }

        if (!isLoggedIn && !guestName.trim()) {
            toast.error(lang === 'ar' ? 'يرجى إدخال اسمك' : 'Please enter your name');
            return;
        }

        setSubmitting(true);
        try {
            await createReview(
                type,
                rating,
                comment,
                type === 'story' ? storyId! : null,
                !isLoggedIn ? guestName : undefined,
                !isLoggedIn ? selectedAvatar : undefined
            );

            toast.success(
                reviewText.thankYou ||
                (lang === 'ar'
                    ? 'شكراً لمراجعتك! سيتم نشرها بعد الموافقة.'
                    : 'Thank you for your review! It will be published after approval.')
            );

            // Reset and close
            setRating(0);
            setComment('');
            setGuestName('');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-dark-card border-b dark:border-gray-700 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {type === 'story'
                            ? reviewText.rateStory || (lang === 'ar' ? 'قيّم القصة' : 'Rate Story')
                            : reviewText.writeReview || (lang === 'ar' ? 'اكتب مراجعة' : 'Write Review')
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Guest Name (if not logged in) */}
                    {!isLoggedIn && (
                        <div>
                            <label className="block font-bold mb-2 text-gray-900 dark:text-white">
                                {lang === 'ar' ? 'اسمك' : lang === 'fr' ? 'Votre Nom' : 'Your Name'}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder={lang === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
                                className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                                maxLength={50}
                            />
                        </div>
                    )}

                    {/* Avatar Selection (if not logged in) */}
                    {!isLoggedIn && (
                        <div>
                            <label className="block font-bold mb-3 text-gray-900 dark:text-white">
                                {lang === 'ar' ? 'اختر صورتك الشخصية' : lang === 'fr' ? 'Choisissez Votre Avatar' : 'Choose Your Avatar'}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {GUEST_AVATARS.map(avatar => (
                                    <button
                                        key={avatar.id}
                                        type="button"
                                        onClick={() => setSelectedAvatar(avatar.id)}
                                        className={`relative aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all ${
                                            selectedAvatar === avatar.id
                                                ? 'ring-4 ring-primary scale-110 shadow-xl'
                                                : 'hover:scale-105 shadow-md'
                                        }`}
                                        style={{ backgroundColor: avatar.color }}
                                        title={avatar.name}
                                    >
                                        {avatar.emoji}
                                        {selectedAvatar === avatar.id && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rating */}
                    <div>
                        <label className="block font-bold mb-3 text-gray-900 dark:text-white">
                            {reviewText.rating || (lang === 'ar' ? 'التقييم' : 'Rating')}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2" dir="ltr">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-125"
                                >
                                    <Star
                                        size={40}
                                        className={`${
                                            star <= (hoveredRating || rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                        } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block font-bold mb-2 text-gray-900 dark:text-white">
                            {reviewText.yourReview || (lang === 'ar' ? 'مراجعتك' : 'Your Review')}
                            {' '}<span className="text-gray-400 font-normal text-sm">
                                ({lang === 'ar' ? 'اختياري' : 'Optional'})
                            </span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={
                                lang === 'ar'
                                    ? 'شاركنا رأيك...'
                                    : lang === 'fr'
                                    ? 'Partagez votre avis...'
                                    : 'Share your thoughts...'
                            }
                            className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={4}
                            maxLength={500}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {comment.length}/500
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || rating === 0}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {submitting
                            ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                            : (reviewText.submit || (lang === 'ar' ? 'إرسال' : 'Submit'))
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};
