import React, { useState, useEffect } from 'react';
import { Star, Trash2, Check, X, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getAvatarData } from '../constants/avatars';

interface Review {
    id: number;
    userId?: number;
    storyId?: string;
    type: 'story' | 'platform';
    rating: number;
    comment: string;
    isApproved: boolean;
    isFeatured: boolean;
    guestName?: string;
    guestAvatar?: string;
    userName?: string;
    createdAt: string;
    User?: { username: string };
}

interface ReviewsManagementProps {
    lang: 'ar' | 'en' | 'fr';
}

export const ReviewsManagement: React.FC<ReviewsManagementProps> = ({ lang }) => {
    const isRTL = lang === 'ar';
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

    const t = {
        ar: {
            title: 'إدارة الآراء والتقييمات',
            refresh: 'تحديث',
            all: 'الكل',
            approved: 'معتمد',
            pending: 'في الانتظار',
            approve: 'موافقة',
            reject: 'رفض',
            delete: 'حذف',
            feature: 'تمييز',
            unfeature: 'إلغاء التمييز',
            confirmDelete: 'هل أنت متأكد من الحذف؟',
            rating: 'التقييم',
            comment: 'التعليق',
            author: 'الكاتب',
            date: 'التاريخ',
            actions: 'الإجراءات',
            noReviews: 'لا توجد آراء',
            featured: 'مميز',
            platform: 'المنصة',
            story: 'قصة'
        },
        en: {
            title: 'Reviews & Ratings Management',
            refresh: 'Refresh',
            all: 'All',
            approved: 'Approved',
            pending: 'Pending',
            approve: 'Approve',
            reject: 'Reject',
            delete: 'Delete',
            feature: 'Feature',
            unfeature: 'Unfeature',
            confirmDelete: 'Are you sure you want to delete?',
            rating: 'Rating',
            comment: 'Comment',
            author: 'Author',
            date: 'Date',
            actions: 'Actions',
            noReviews: 'No reviews yet',
            featured: 'Featured',
            platform: 'Platform',
            story: 'Story'
        },
        fr: {
            title: 'Gestion des Avis et Évaluations',
            refresh: 'Actualiser',
            all: 'Tous',
            approved: 'Approuvé',
            pending: 'En attente',
            approve: 'Approuver',
            reject: 'Rejeter',
            delete: 'Supprimer',
            feature: 'Mettre en avant',
            unfeature: 'Retirer',
            confirmDelete: 'Êtes-vous sûr de vouloir supprimer?',
            rating: 'Évaluation',
            comment: 'Commentaire',
            author: 'Auteur',
            date: 'Date',
            actions: 'Actions',
            noReviews: 'Aucun avis',
            featured: 'En vedette',
            platform: 'Plateforme',
            story: 'Histoire'
        }
    };

    const texts = t[lang];

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reviews/all');
            setReviews(res.data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await api.patch(`/reviews/${id}/approve`);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
            toast.success(isRTL ? 'تمت الموافقة' : 'Approved');
        } catch (error) {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await api.patch(`/reviews/${id}/reject`);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: false } : r));
            toast.success(isRTL ? 'تم الرفض' : 'Rejected');
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(texts.confirmDelete)) return;
        try {
            await api.delete(`/reviews/${id}`);
            setReviews(prev => prev.filter(r => r.id !== id));
            toast.success(isRTL ? 'تم الحذف' : 'Deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleToggleFeatured = async (id: number, currentStatus: boolean) => {
        try {
            await api.patch(`/reviews/${id}/feature`, { isFeatured: !currentStatus });
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !currentStatus } : r));
            toast.success(isRTL ? 'تم التحديث' : 'Updated');
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (filter === 'approved') return review.isApproved;
        if (filter === 'pending') return !review.isApproved;
        return true;
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black dark:text-white">{texts.title}</h2>
                <button
                    onClick={fetchReviews}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
                >
                    <RefreshCw size={18} />
                    {texts.refresh}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {['all', 'approved', 'pending'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            filter === f
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {texts[f as keyof typeof texts]}
                    </button>
                ))}
            </div>

            {/* Reviews Table */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading...</div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500">{texts.noReviews}</div>
            ) : (
                <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">{texts.author}</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">{texts.rating}</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">{texts.comment}</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">{texts.date}</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">{texts.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredReviews.map((review) => {
                                    const avatar = review.guestAvatar ? getAvatarData(review.guestAvatar) : null;
                                    const displayName = review.userName || review.User?.username || review.guestName || 'Anonymous';

                                    return (
                                        <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {avatar && (
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                                            style={{ backgroundColor: avatar.color }}
                                                        >
                                                            {avatar.emoji}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold dark:text-white">{displayName}</p>
                                                        {review.isFeatured && (
                                                            <span className="text-xs text-yellow-500 font-bold">{texts.featured}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                            fill={i < review.rating ? 'currentColor' : 'none'}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-xs">
                                                    {review.comment}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                                                    {review.type === 'platform' ? texts.platform : texts.story}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!review.isApproved && (
                                                        <button
                                                            onClick={() => handleApprove(review.id)}
                                                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:scale-110 transition-transform"
                                                            title={texts.approve}
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    {review.isApproved && (
                                                        <button
                                                            onClick={() => handleReject(review.id)}
                                                            className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:scale-110 transition-transform"
                                                            title={texts.reject}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleFeatured(review.id, review.isFeatured)}
                                                        className={`p-2 rounded-lg hover:scale-110 transition-transform ${
                                                            review.isFeatured
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                        title={review.isFeatured ? texts.unfeature : texts.feature}
                                                    >
                                                        <Star size={16} fill={review.isFeatured ? 'currentColor' : 'none'} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(review.id)}
                                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:scale-110 transition-transform"
                                                        title={texts.delete}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
