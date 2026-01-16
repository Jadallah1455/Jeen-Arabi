const Story = require('../models/Story');
const Tag = require('../models/Tag');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');

const deleteFile = (fileUrl) => {
    if (!fileUrl) return;
    try {
        const filename = fileUrl.split('/uploads/').pop();
        if (!filename) return;

        const filePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
        }

        // If it's a PDF, also check for its images folder
        if (filename.toLowerCase().endsWith('.pdf')) {
            const dirName = path.parse(filename).name;
            const dirPath = path.join(__dirname, '../uploads', dirName);
            if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`Deleted associated folder: ${dirPath}`);
            }
        }
    } catch (err) {
        console.error(`Failed to delete: ${fileUrl}`, err);
    }
};

// [هام] دالة مساعدة لمزامنة الوسوم مع جدول Tags
const syncTagsWithDatabase = async (tagsData) => {
    if (!tagsData) return;

    let tagsArray = [];
    if (typeof tagsData === 'string') {
        // Support both JSON array strings and comma-separated tags
        try {
            const parsed = JSON.parse(tagsData);
            tagsArray = Array.isArray(parsed) ? parsed : [tagsData];
        } catch (e) {
            tagsArray = tagsData.split(',').map(t => t.trim()).filter(Boolean);
        }
    } else if (Array.isArray(tagsData)) {
        tagsArray = tagsData;
    }

    const { Op } = require('sequelize');

    for (let tagName of tagsArray) {
        if (!tagName || typeof tagName !== 'string') continue;
        tagName = tagName.trim();

        try {
            // Robust search: match if it exists in any of the name keys (en, ar, fr)
            // Or if the slug matches the normalized version of the input
            const normalizedSlug = tagName.toLowerCase()
                .replace(/[^\w\s\u0600-\u06FF-]/g, '') // Keep alphanumeric, spaces, and Arabic chars
                .replace(/\s+/g, '-');

            const existingTag = await Tag.findOne({
                where: {
                    [Op.or]: [
                        sequelize.where(sequelize.fn('JSON_EXTRACT', sequelize.col('name'), '$.en'), tagName),
                        sequelize.where(sequelize.fn('JSON_EXTRACT', sequelize.col('name'), '$.ar'), tagName),
                        sequelize.where(sequelize.fn('JSON_EXTRACT', sequelize.col('name'), '$.fr'), tagName),
                        { slug: normalizedSlug }
                    ]
                }
            });

            if (!existingTag) {
                await Tag.create({
                    // Initial creation: we use the input as the value for all supported languages
                    name: { en: tagName, ar: tagName, fr: tagName },
                    slug: normalizedSlug,
                    count: 1
                });
            } else {
                await existingTag.increment('count');
            }
        } catch (err) {
            console.log('Tag sync warning:', err.message);
        }
    }
};
// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
const getStories = async (req, res) => {
    try {
        const stories = await Story.findAll();
        res.status(200).json(stories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get story by ID
// @route   GET /api/stories/:id
// @access  Public
const getStoryById = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        res.status(200).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a story
// @route   POST /api/stories
// @access  Private (Admin)
const createStory = async (req, res) => {
    try {
        const story = await Story.create(req.body);

        // [هام] مزامنة الوسوم بعد إنشاء القصة
        if (req.body.tags) {
            await syncTagsWithDatabase(req.body.tags);
        }

        // Trigger New Story Notification for all users
        const users = await User.findAll({ attributes: ['id'] });
        const notificationPromises = users.map(u => {
            // [Improvement] Prioritize Arabic Title as universal fallback to avoid 'Untitled' or generic text
            const storyTitleForNotif = (story.title && story.title.ar) ? story.title.ar : (story.title && story.title.en ? story.title.en : 'قصة جديدة');

            return createNotification(u.id, {
                titleAr: 'مفاجأة سحرية في انتظارك!',
                titleEn: 'A Magical Surprise Awaits!',
                titleFr: 'Une surprise magique vous attend !',
                messageAr: `حكاية جديدة بعنوان "${story.title.ar || storyTitleForNotif}" انضمت لعالمنا. استعد لرحلة خيالية لا تنسى!`,
                messageEn: `The tale "${story.title.en || storyTitleForNotif}" has just landed in our world. Get ready for an unforgettable journey!`,
                messageFr: `L'histoire "${story.title.fr || storyTitleForNotif}" vient d'arriver. Préparez-vous pour un voyage inoubliable !`,
                type: 'story',
                targetId: story.id,
                targetType: 'story'
            });
        });
        // We don't want to block the response on sending notifications to all users
        // But for small scale, Promise.all is fine.
        Promise.all(notificationPromises).catch(err => console.error('Bulk notification error:', err));

        res.status(201).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
// @access  Private (Admin)
const updateStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if files are being updated and delete old ones
        if (req.body.coverImage && req.body.coverImage !== story.coverImage) {
            deleteFile(story.coverImage);
        }
        if (req.body.pdfUrl && req.body.pdfUrl !== story.pdfUrl) {
            deleteFile(story.pdfUrl);
        }

        const updateData = {
            ...req.body,
            views: req.body.views === undefined ? story.views : req.body.views,
            downloads: req.body.downloads === undefined ? story.downloads : req.body.downloads,
        };

        await story.update(updateData);

        // [هام] مزامنة الوسوم عند التحديث أيضاً
        if (req.body.tags) {
            await syncTagsWithDatabase(req.body.tags);
        }

        res.status(200).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
const deleteStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Delete associated files
        deleteFile(story.coverImage);
        deleteFile(story.pdfUrl);

        await story.destroy();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Increment views
// @route   PATCH /api/stories/:id/view
// @access  Public
const incrementViews = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        await story.increment('views');
        res.status(200).json({ message: 'Views incremented' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Increment downloads
// @route   PATCH /api/stories/:id/download
// @access  Public
const incrementDownloads = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        await story.increment('downloads');
        res.status(200).json({ message: 'Downloads incremented' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get recommended stories for user
// @route   GET /api/stories/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get user's reading history and favorites
        const user = await User.findByPk(userId, {
            include: [{
                model: Story,
                as: 'Stories',
                attributes: ['id', 'tags', 'categoryLabel'],
                through: {
                    attributes: ['timesRead', 'isFavorite', 'isCompleted']
                }
            }]
        });

        if (!user || !user.Stories || user.Stories.length === 0) {
            // Fallback: Return most viewed stories if no history
            const trending = await Story.findAll({
                order: [['views', 'DESC']],
                limit: 5
            });
            return res.json(trending);
        }

        // 2. Extract preferences (tags & categories)
        const tagCounts = {};
        const catCounts = {};
        const readStoryIds = new Set();

        user.Stories.forEach(s => {
            readStoryIds.add(s.id);
            const weight = (s.UserStory.isFavorite ? 3 : 1) + (s.UserStory.timesRead || 1);
            
            // Count tags
            if (s.tags) {
                // Ensure tags is array
                const tags = Array.isArray(s.tags) ? s.tags : (typeof s.tags === 'string' ? JSON.parse(s.tags) : []);
                tags.forEach(t => {
                    tagCounts[t] = (tagCounts[t] || 0) + weight;
                });
            }

            // Count categories
            if (s.categoryLabel) {
                catCounts[s.categoryLabel] = (catCounts[s.categoryLabel] || 0) + weight;
            }
        });

        // Get top 3 tags
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(x => x[0]);

        // Get top category
        const topCategory = Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .map(x => x[0])[0];

        // 3. Find similar stories
        const { Op } = require('sequelize');
        
        // Build query
        const whereClause = {
            id: { [Op.notIn]: Array.from(readStoryIds) } // Exclude already read
        };

        const orConditions = [];
        
        if (topCategory) {
            orConditions.push({ categoryLabel: topCategory });
        }

        if (topTags.length > 0) {
            // For JSON scanning/array contains. 
            // SQLite/MySQL JSON support varies, using simple LIKE for stringified JSON or text array in SQLite
            // Assuming simple string matching for compatibility or JSON_CONTAINS if MySQL 5.7+
            // Here using a simpler Op.or with LIKE for maximum compatibility given uncertain DB config
             topTags.forEach(tag => {
                orConditions.push({ 
                    tags: { [Op.like]: `%"${tag}"%` }
                });
            });
        }

        if (orConditions.length > 0) {
            whereClause[Op.or] = orConditions;
        }

        let recommendations = await Story.findAll({
            where: whereClause,
            limit: 6,
            order: [['views', 'DESC']] // Secondary sort by popularity
        });

        // If not enough recommendations, fill with trending
        if (recommendations.length < 3) {
            const extra = await Story.findAll({
                where: {
                    id: { [Op.notIn]: [...Array.from(readStoryIds), ...recommendations.map(r => r.id)] }
                },
                order: [['views', 'DESC']],
                limit: 3
            });
            recommendations = [...recommendations, ...extra];
        }

        res.json(recommendations);

    } catch (error) {
        console.error('Recommendation Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get similar stories (for details page)
// @route   GET /api/stories/:id/similar
// @access  Public
const getSimilarStories = async (req, res) => {
    try {
        const storyId = req.params.id;
        const currentStory = await Story.findByPk(storyId);

        if (!currentStory) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const { Op } = require('sequelize');
        const tags = Array.isArray(currentStory.tags) ? currentStory.tags : [];
        
        const whereClause = {
            id: { [Op.ne]: storyId }, // Exclude current story
            [Op.or]: [
                { categoryLabel: currentStory.categoryLabel }
            ]
        };

        if (tags.length > 0) {
            // Add tag matching
             tags.forEach(tag => {
                whereClause[Op.or].push({ 
                    tags: { [Op.like]: `%"${tag}"%` }
                });
            });
        }

        const similar = await Story.findAll({
            where: whereClause,
            limit: 4,
            order: sequelize.random() // Randomize selection
        });

        res.json(similar);
    } catch (error) {
        console.error('Similar Stories Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    incrementViews,
    incrementDownloads,
    getRecommendations,
    getSimilarStories
};
