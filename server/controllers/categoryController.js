const Category = require('../models/Category');

// دالة مساعدة لضمان تحويل النص إلى كائن لغوي سليم قبل الحفظ
const processNameAndDescription = (value) => {
    if (typeof value === 'string') {
        // إذا أرسل المستخدم نصاً بسيطاً، نحوله إلى كائن مزدوج لغوي سليم
        return { en: value, ar: value };
    } else if (!value || typeof value !== 'object') {
        // إذا كانت القيمة مفقودة أو غير صالحة، نرجع كائن فارغ آمن
        return {};
    }
    return value;
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error("getCategories Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    try {
        let { name, description } = req.body;

        // --- خط الدفاع الجديد: ضمان أن name هو كائن JSON ---
        // إذا كان "name" نصاً بسيطاً (غير كائن JSON)، نحوله إلى كائن لغة مفترض.
        if (typeof name === 'string') {
            name = {
                en: name,
                ar: name
            };
        }
        // إذا لم يكن name موجوداً أصلاً، نضمن أنه كائن فارغ.
        if (!name || typeof name !== 'object') {
            name = {};
        }

        const category = await Category.create({
            name,
            description
        });
        res.status(201).json(category);
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findByPk(req.params.id);

        if (category) {

            // --- خط الدفاع في التحديث ---
            // نأخذ القيمة الجديدة فقط إذا كانت موجودة (للسماح بالتعديل الجزئي)
            if (name !== undefined) {
                category.name = processNameAndDescription(name);
            }
            if (description !== undefined) {
                category.description = processNameAndDescription(description);
            }

            // نستخدم save() لحفظ التغييرات
            const updatedCategory = await category.save();

            // [New] Dynamic Update: Update category labels in all associated stories
            // This ensures renamed categories reflect everywhere instantly.
            const Story = require('../models/Story');
            const { Op } = require('sequelize');

            // This is a simplified approach: update all stories where this category ID is present
            // Note: Since 'categories' is a JSON array, we use JSON_CONTAINS if available or a simple query
            // For safety and compatibility with all DB versions:
            const storiesToUpdate = await Story.findAll();
            for (const story of storiesToUpdate) {
                if (Array.isArray(story.categories) && story.categories.includes(req.params.id)) {
                    // Force a re-render/save by re-assigning (Sequelize tracks JSON changes this way sometimes)
                    story.changed('categories', true);
                    await story.save();
                }
            }

            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error("updateCategory Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (category) {
            await category.destroy();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error("deleteCategory Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
