const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { PageVisit, VisitorInfo, SocialShare, Story } = require('../models/associations');

/**
 * Get overall visitor statistics
 */
const getVisitorStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Total unique visitors (by session)
        const uniqueVisitors = await VisitorInfo.count({
            where: dateFilter,
            distinct: true,
            col: 'sessionId'
        });

        // Total page views
        const totalPageViews = await PageVisit.count({
            where: dateFilter
        });

        // Registered users who visited
        const registeredVisitors = await PageVisit.count({
            where: {
                ...dateFilter,
                userId: { [Op.not]: null }
            },
            distinct: true,
            col: 'userId'
        });

        // Average pages per session
        const avgPagesPerSession = totalPageViews / (uniqueVisitors || 1);

        // Most active hours
        const hourlyStats = await PageVisit.findAll({
            attributes: [
                [sequelize.fn('HOUR', sequelize.col('createdAt')), 'hour'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'visits']
            ],
            where: dateFilter,
            group: [sequelize.fn('HOUR', sequelize.col('createdAt'))],
            raw: true
        });

        // Growth over time (daily)
        const dailyGrowth = await PageVisit.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'visitors'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'pageViews']
            ],
            where: dateFilter,
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        res.json({
            summary: {
                uniqueVisitors,
                totalPageViews,
                registeredVisitors,
                avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10
            },
            hourlyStats,
            dailyGrowth
        });
    } catch (error) {
        console.error('Get visitor stats error:', error);
        res.status(500).json({ message: 'Failed to fetch visitor statistics' });
    }
};

/**
 * Get geographic distribution
 */
const getGeographicDistribution = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const countryStats = await VisitorInfo.findAll({
            attributes: [
                'country',
                'countryName',
                [sequelize.fn('COUNT', sequelize.col('id')), 'visitors']
            ],
            where: {
                ...dateFilter,
                country: { [Op.not]: null }
            },
            group: ['country', 'countryName'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 20,
            raw: true
        });

        const cityStats = await VisitorInfo.findAll({
            attributes: [
                'city',
                'country',
                [sequelize.fn('COUNT', sequelize.col('id')), 'visitors']
            ],
            where: {
                ...dateFilter,
                city: { [Op.not]: null }
            },
            group: ['city', 'country'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 15,
            raw: true
        });

        res.json({
            countries: countryStats,
            cities: cityStats
        });
    } catch (error) {
        console.error('Get geographic distribution error:', error);
        res.status(500).json({ message: 'Failed to fetch geographic data' });
    }
};

/**
 * Get device and browser breakdown
 */
const getDeviceBreakdown = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const deviceStats = await VisitorInfo.findAll({
            attributes: [
                'device',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                ...dateFilter,
                device: { [Op.not]: null }
            },
            group: ['device'],
            raw: true
        });

        const browserStats = await VisitorInfo.findAll({
            attributes: [
                'browser',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                ...dateFilter,
                browser: { [Op.not]: null }
            },
            group: ['browser'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10,
            raw: true
        });

        const osStats = await VisitorInfo.findAll({
            attributes: [
                'os',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                ...dateFilter,
                os: { [Op.not]: null }
            },
            group: ['os'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10,
            raw: true
        });

        const languageStats = await VisitorInfo.findAll({
            attributes: [
                'language',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                ...dateFilter,
                language: { [Op.not]: null }
            },
            group: ['language'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10,
            raw: true
        });

        res.json({
            devices: deviceStats,
            browsers: browserStats,
            operatingSystems: osStats,
            languages: languageStats
        });
    } catch (error) {
        console.error('Get device breakdown error:', error);
        res.status(500).json({ message: 'Failed to fetch device data' });
    }
};

/**
 * Get traffic sources (UTM tracking)
 */
const getTrafficSources = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const sourceStats = await PageVisit.findAll({
            attributes: [
                'utmSource',
                'utmMedium',
                'utmCampaign',
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'visitors'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'pageViews']
            ],
            where: {
                ...dateFilter,
                utmSource: { [Op.not]: null }
            },
            group: ['utmSource', 'utmMedium', 'utmCampaign'],
            order: [[sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'DESC']],
            raw: true
        });

        // Direct traffic (no UTM)
        const directTraffic = await PageVisit.count({
            where: {
                ...dateFilter,
                utmSource: null,
                referrer: null
            },
            distinct: true,
            col: 'sessionId'
        });

        // Referral traffic (has referrer but no UTM)
        const referralStats = await PageVisit.findAll({
            attributes: [
                'referrer',
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'visitors']
            ],
            where: {
                ...dateFilter,
                utmSource: null,
                referrer: { [Op.not]: null }
            },
            group: ['referrer'],
            order: [[sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'DESC']],
            limit: 10,
            raw: true
        });

        res.json({
            utmSources: sourceStats,
            directTraffic,
            referrals: referralStats
        });
    } catch (error) {
        console.error('Get traffic sources error:', error);
        res.status(500).json({ message: 'Failed to fetch traffic sources' });
    }
};

/**
 * Get top performing stories
 */
const getTopStories = async (req, res) => {
    try {
        const { startDate, endDate, limit = 10 } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const topStories = await PageVisit.findAll({
            attributes: [
                'storyId',
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'uniqueViews'],
                [sequelize.fn('COUNT', sequelize.col('PageVisit.id')), 'totalViews']
            ],
            where: {
                ...dateFilter,
                storyId: { [Op.not]: null }
            },
            include: [{
                model: Story,
                attributes: ['id', 'title', 'coverImage', 'categories'],
                required: false
            }],
            group: ['storyId', 'Story.id'],
            order: [[sequelize.fn('COUNT', sequelize.literal('DISTINCT sessionId')), 'DESC']],
            limit: parseInt(limit),
            subQuery: false
        });

        res.json(topStories);
    } catch (error) {
        console.error('Get top stories error:', error);
        res.status(500).json({ message: 'Failed to fetch top stories' });
    }
};

/**
 * Get social media performance
 */
const getSocialMediaStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const platformStats = await SocialShare.findAll({
            attributes: [
                'platform',
                [sequelize.fn('SUM', sequelize.col('clicks')), 'totalClicks'],
                [sequelize.fn('SUM', sequelize.col('conversions')), 'totalConversions'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT storyId')), 'storiesShared']
            ],
            where: dateFilter,
            group: ['platform'],
            raw: true
        });

        // Top shared stories
        const topSharedStories = await SocialShare.findAll({
            attributes: [
                'storyId',
                [sequelize.fn('SUM', sequelize.col('clicks')), 'totalClicks'],
                [sequelize.fn('SUM', sequelize.col('conversions')), 'totalConversions']
            ],
            where: dateFilter,
            include: [{
                model: Story,
                attributes: ['id', 'title', 'coverImage'],
                required: false
            }],
            group: ['storyId', 'Story.id'],
            order: [[sequelize.fn('SUM', sequelize.col('conversions')), 'DESC']],
            limit: 10,
            subQuery: false
        });

        res.json({
            platforms: platformStats,
            topSharedStories
        });
    } catch (error) {
        console.error('Get social media stats error:', error);
        res.status(500).json({ message: 'Failed to fetch social media statistics' });
    }
};

/**
 * Track social share (when user clicks share button)
 */
const trackShare = async (req, res) => {
    try {
        const { storyId, platform } = req.body;
        const userId = req.user?.id || null;

        const [share, created] = await SocialShare.findOrCreate({
            where: { storyId, platform },
            defaults: {
                userId,
                clicks: 1,
                conversions: 0
            }
        });

        if (!created) {
            await share.increment('clicks');
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Track share error:', error);
        res.status(500).json({ message: 'Failed to track share' });
    }
};

module.exports = {
    getVisitorStats,
    getGeographicDistribution,
    getDeviceBreakdown,
    getTrafficSources,
    getTopStories,
    getSocialMediaStats,
    trackShare
};
