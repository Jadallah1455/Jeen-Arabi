import api from './api';

export interface Review {
    id: number;
    userId: number | null;
    storyId?: string;
    type: 'story' | 'platform';
    rating: number;
    comment?: string;
    isApproved: boolean;
    isFeatured: boolean;
    userName?: string;
    guestName?: string;
    guestAvatar?: string;
    User?: {
        id: number;
        username: string;
    };
    createdAt: string;
}

export interface StoryReviewsData {
    reviews: Review[];
    totalReviews: number;
    averageRating: number;
}

/**
 * Create a new review
 */
export const createReview = async (
    type: 'story' | 'platform',
    rating: number,
    comment?: string,
    storyId?: string | null,
    guestName?: string,
    guestAvatar?: string
) => {
    const response = await api.post('/reviews', {
        storyId,
        type,
        rating,
        comment,
        guestName,
        guestAvatar
    });
    return response.data;
};

/**
 * Get reviews for a specific story
 */
export const getStoryReviews = async (storyId: string): Promise<StoryReviewsData> => {
    const response = await api.get(`/reviews/story/${storyId}`);
    return response.data;
};

/**
 * Get featured platform testimonials
 */
export const getPlatformReviews = async (): Promise<Review[]> => {
    const response = await api.get('/reviews/platform/featured');
    return response.data;
};

/**
 * Get all reviews (Admin)
 */
export const getAllReviews = async (approved?: boolean, type?: string) => {
    const params = new URLSearchParams();
    if (approved !== undefined) params.append('approved', approved.toString());
    if (type) params.append('type', type);
    
    const response = await api.get(`/reviews/admin/all?${params}`);
    return response.data;
};

/**
 * Approve a review (Admin)
 */
export const approveReview = async (id: number) => {
    const response = await api.patch(`/reviews/${id}/approve`);
    return response.data;
};

/**
 * Toggle featured status (Admin)
 */
export const toggleFeatureReview = async (id: number) => {
    const response = await api.patch(`/reviews/${id}/feature`);
    return response.data;
};

/**
 * Delete a review (Admin)
 */
export const deleteReview = async (id: number) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
};
