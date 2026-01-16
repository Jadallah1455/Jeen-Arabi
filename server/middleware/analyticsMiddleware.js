const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { PageVisit, VisitorInfo } = require('../models/associations');

/**
 * Analytics Middleware
 * Automatically tracks all page visits and visitor information
 */
const analyticsMiddleware = async (req, res, next) => {
    try {
        // Skip tracking for development/static assets
        if (process.env.NODE_ENV === 'development' || 
            req.path.startsWith('/api/') || 
            req.path.match(/\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
            return next();
        }

        // Extract session ID from cookie or create new one
        let sessionId = req.cookies?.sessionId;
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            res.cookie('sessionId', sessionId, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
        }

        // Get IP address (handle proxies)
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                         req.connection?.remoteAddress || 
                         req.socket?.remoteAddress || 
                         req.ip;

        // Hash IP for privacy (GDPR compliance)
        const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

        // Parse User Agent
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        // Get geo-location from IP
        const geo = geoip.lookup(ipAddress);

        // Extract UTM parameters
        const utmSource = req.query.utm_source || null;
        const utmMedium = req.query.utm_medium || null;
        const utmCampaign = req.query.utm_campaign || null;
        const utmContent = req.query.utm_content || null;

        // Determine device type
        let deviceType = 'desktop';
        if (uaResult.device.type === 'mobile') deviceType = 'mobile';
        else if (uaResult.device.type === 'tablet') deviceType = 'tablet';

        // Save visitor info if new session
        const existingVisitor = await VisitorInfo.findOne({ where: { sessionId } });
        if (!existingVisitor) {
            await VisitorInfo.create({
                sessionId,
                ipHash,
                country: geo?.country || null,
                countryName: geo?.country || null,
                city: geo?.city || null,
                region: geo?.region || null,
                timezone: geo?.timezone || null,
                device: deviceType,
                browser: uaResult.browser.name || null,
                browserVersion: uaResult.browser.version || null,
                os: uaResult.os.name || null,
                osVersion: uaResult.os.version || null,
                language: req.headers['accept-language']?.split(',')[0] || null,
                screenResolution: req.query.screen || null,
                userAgent: req.headers['user-agent']
            });
        }

        // Track page visit
        const userId = req.user?.id || null;
        const storyId = req.query.storyId || req.params.id || null;

        await PageVisit.create({
            userId,
            sessionId,
            url: req.originalUrl || req.url,
            referrer: req.headers.referer || req.headers.referrer || null,
            utmSource,
            utmMedium,
            utmCampaign,
            utmContent,
            storyId
        });

        // Track conversion for social shares
        if (utmSource && storyId) {
            const { SocialShare } = require('../models/associations');
            const platformMap = {
                'facebook': 'facebook',
                'fb': 'facebook',
                'twitter': 'twitter',
                'x': 'twitter',
                'whatsapp': 'whatsapp',
                'wa': 'whatsapp',
                'telegram': 'telegram',
                'linkedin': 'linkedin'
            };
            
            const platform = platformMap[utmSource.toLowerCase()] || 'other';
            
            // Find or create social share record
            const [share] = await SocialShare.findOrCreate({
                where: { storyId, platform },
                defaults: { clicks: 0, conversions: 0 }
            });

            // Increment conversion
            await share.increment('conversions');
        }

    } catch (error) {
        console.error('Analytics middleware error:', error);
        // Don't block request if analytics fails
    }

    next();
};

module.exports = analyticsMiddleware;
