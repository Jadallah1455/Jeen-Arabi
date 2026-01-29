const { User, Story, UserStory } = require('../models/associations');
const { createNotification } = require('./notificationController');

// @desc    Toggle story as favorite
// @route   POST /api/users/favorites/:storyId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        const story = await Story.findByPk(storyId);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        let [userStory, created] = await UserStory.findOrCreate({
            where: { UserId: userId, StoryId: storyId }
        });

        userStory.isFavorite = !userStory.isFavorite;
        await userStory.save();

        res.json({
            isFavorite: userStory.isFavorite,
            message: userStory.isFavorite ? 'Added to favorites' : 'Removed from favorites'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user favorite stories
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Story,
                as: 'Stories',
                through: {
                    where: { isFavorite: true }
                }
            }]
        });

        if (!user) {
            return res.json([]);
        }

        res.json(user.Stories || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Record story reading
// @route   POST /api/users/history/:storyId
// @access  Private
const recordReading = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        const story = await Story.findByPk(storyId);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        let [userStory, created] = await UserStory.findOrCreate({
            where: { UserId: userId, StoryId: storyId }
        });

        userStory.lastRead = new Date();
        userStory.timesRead += 1;
        await userStory.save();

        // Also update the global story views count
        story.views += 1;
        await story.save();

        // Return user progress data for resume reading feature
        res.json({
            message: 'Reading recorded',
            progress: {
                lastPageReached: userStory.lastPageReached,
                isCompleted: userStory.isCompleted
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update reading progress (time, page, completion)
// @route   PUT /api/users/history/:storyId/progress
// @access  Private
const updateReadingProgress = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { lastPageReached, additionalTime, isCompleted } = req.body;
        const userId = req.user.id;

        const userStory = await UserStory.findOne({
            where: { UserId: userId, StoryId: storyId }
        });

        if (!userStory) {
            return res.status(404).json({ message: 'Progress record not found' });
        }

        if (lastPageReached !== undefined) {
            userStory.lastPageReached = lastPageReached;
        }

        if (additionalTime !== undefined) {
            userStory.totalReadingTime += parseInt(additionalTime);
        }

        if (isCompleted !== undefined) {
            const previouslyCompleted = userStory.isCompleted;
            userStory.isCompleted = isCompleted;

            // Trigger Achievement Notification if newly completed
            if (isCompleted && !previouslyCompleted) {
                const story = await Story.findByPk(storyId);
                
                // Award points for completion
                const user = await User.findByPk(userId);
                if (user) {
                    user.points += 50; // 50 points for finishing a story
                    await user.save();
                }

                await createNotification(userId, {
                    titleAr: 'تهانينا! 🎉',
                    titleEn: 'Congratulations! 🎉',
                    titleFr: 'Félicitations ! 🎉',
                    messageAr: `لقد أتممت قراءة قصة "${story.title.ar}". استمر في هذا العمل الرائع! (+50 نقطة)`,
                    messageEn: `You have completed reading "${story.title.en}". Keep up the great work! (+50 points)`,
                    messageFr: `Vous avez terminé la lecture de "${story.title.fr || story.title.en}". Continuez comme ça ! (+50 points)`,
                    type: 'achievement'
                });
            }
        }

        await userStory.save();
        res.json({ message: 'Progress updated', totalReadingTime: userStory.totalReadingTime });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user reading history
// @route   GET /api/users/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Story,
                as: 'Stories',
                through: {
                    attributes: ['lastRead', 'timesRead', 'isFavorite', 'lastPageReached', 'totalReadingTime', 'isCompleted'],
                    where: {
                        lastRead: { [require('sequelize').Op.ne]: null }
                    }
                }
            }]
        });

        if (!user || !user.Stories) {
            return res.json([]);
        }

        // Sort by lastRead descending
        const history = (user.Stories || []).sort((a, b) =>
            new Date(b.UserStory.lastRead) - new Date(a.UserStory.lastRead)
        );

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Save quiz result
// @route   POST /api/users/history/:storyId/quiz
// @access  Private
const saveQuizResult = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { score, total } = req.body;
        const userId = req.user.id;

        // Critical Security: Validate quiz scores to prevent manipulation
        if (!score && score !== 0 || !total || typeof score !== 'number' || typeof total !== 'number') {
            return res.status(400).json({ message: 'Invalid quiz data format' });
        }

        if (score > total) {
            return res.status(400).json({ message: 'Score cannot exceed total questions' });
        }

        if (score < 0 || total < 1) {
            return res.status(400).json({ message: 'Invalid score or total value' });
        }

        if (total > 100) { // Reasonable upper limit for quiz questions
            return res.status(400).json({ message: 'Suspicious quiz total detected' });
        }

        const [userStory] = await UserStory.findOrCreate({
            where: { UserId: userId, StoryId: storyId }
        });

        // Update if new score is better or first time
        if (!userStory.quizScore || score > userStory.quizScore) {
            const pointsDiff = score - (userStory.quizScore || 0);
            userStory.quizScore = score;
            userStory.quizTotal = total;
            await userStory.save();

            // Award points to user
            const user = await User.findByPk(userId);
            if (user && pointsDiff > 0) {
                user.points += pointsDiff * 5; // 5 points per correct answer
                await user.save();
            }
            
            // Could trigger notification here if full marks
            if (score === total) {
                 await createNotification(userId, {
                    titleAr: 'أحسنت! 🌟',
                    titleEn: 'Well Done! 🌟',
                    titleFr: 'Bien joué ! 🌟',
                    messageAr: `لقد حققت العلامة الكاملة في اختبار القصة!`,
                    messageEn: `You achieved a perfect score in the story quiz!`,
                    messageFr: `Vous avez obtenu un score parfait au quiz de l'histoire !`,
                    type: 'achievement'
                });
            }
        }

        res.json({ message: 'Quiz result saved', quizScore: userStory.quizScore, pointsAwarded: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    toggleFavorite,
    getFavorites,
    recordReading,
    updateReadingProgress,
    getHistory,
    getAllUsers,
    deleteUser,
    saveQuizResult
};
