import api from './api';

export interface VisitorStats {
    summary: {
        uniqueVisitors: number;
        totalPageViews: number;
        registeredVisitors: number;
        avgPagesPerSession: number;
    };
    hourlyStats: Array<{ hour: number; visits: number }>;
    dailyGrowth: Array<{ date: string; visitors: number; pageViews: number }>;
}

export interface GeographicData {
    countries: Array<{ country: string; countryName: string; visitors: number }>;
    cities: Array<{ city: string; country: string; visitors: number }>;
}

export interface DeviceData {
    devices: Array<{ device: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
    operatingSystems: Array<{ os: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
}

export interface TrafficSources {
    utmSources: Array<{
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        visitors: number;
        pageViews: number;
    }>;
    directTraffic: number;
    referrals: Array<{ referrer: string; visitors: number }>;
}

/**
 * Fetch visitor statistics
 */
export const getVisitorStats = async (startDate?: string, endDate?: string): Promise<VisitorStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/stats?${params}`);
    return response.data;
};

/**
 * Fetch geographic distribution
 */
export const getGeographicDistribution = async (startDate?: string, endDate?: string): Promise<GeographicData> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/geographic?${params}`);
    return response.data;
};

/**
 * Fetch device breakdown
 */
export const getDeviceBreakdown = async (startDate?: string, endDate?: string): Promise<DeviceData> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/devices?${params}`);
    return response.data;
};

/**
 * Fetch traffic sources
 */
export const getTrafficSources = async (startDate?: string, endDate?: string): Promise<TrafficSources> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/traffic-sources?${params}`);
    return response.data;
};

/**
 * Fetch top stories
 */
export const getTopStories = async (startDate?: string, endDate?: string, limit = 10) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/analytics/top-stories?${params}`);
    return response.data;
};

/**
 * Fetch social media stats
 */
export const getSocialMediaStats = async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/social-media?${params}`);
    return response.data;
};

/**
 * Track social share (call when user clicks share button)
 */
export const trackShare = async (storyId: string, platform: string) => {
    try {
        await api.post('/analytics/track-share', { storyId, platform });
    } catch (error) {
        console.error('Failed to track share:', error);
    }
};

/**
 * Generate UTM link for sharing
 */
export const generateUTMLink = (baseUrl: string, source: string, medium = 'social', campaign = 'story_share', storyId?: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', campaign);
    if (storyId) {
        url.searchParams.set('storyId', storyId);
    }
    return url.toString();
};
