const Design = require('../models/Design');

// @desc    Save a new design
// @route   POST /api/users/designs
// @access  Private
const saveDesign = async (req, res) => {
    try {
        const { title, authorName, content, generatedStory, previewImage } = req.body;
        const userId = req.user.id;

        const design = await Design.create({
            title,
            authorName,
            content,
            generatedStory,
            previewImage,
            userId
        });

        res.status(201).json(design);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user designs
// @route   GET /api/users/designs
// @access  Private
const getMyDesigns = async (req, res) => {
    try {
        const designs = await Design.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(designs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a design
// @route   DELETE /api/users/designs/:id
// @access  Private
const deleteDesign = async (req, res) => {
    try {
        const design = await Design.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!design) {
            return res.status(404).json({ message: 'Design not found' });
        }

        await design.destroy();
        res.json({ message: 'Design removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    saveDesign,
    getMyDesigns,
    deleteDesign
};
