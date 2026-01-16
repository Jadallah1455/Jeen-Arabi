const fs = require('fs').promises;
const path = require('path');

const TIPS_FILE = path.join(__dirname, '../data/dailyTips.json');

// Get all tips
exports.getTips = async (req, res) => {
    try {
        const data = await fs.readFile(TIPS_FILE, 'utf8');
        const tips = JSON.parse(data);
        res.json(tips);
    } catch (error) {
        console.error('Error reading tips:', error);
        res.status(500).json({ message: 'Error reading tips', error: error.message });
    }
};

// Add new tip
exports.addTip = async (req, res) => {
    try {
        const { ar, en, fr } = req.body;
        
        if (!ar || !en || !fr) {
            return res.status(400).json({ message: 'All language fields (ar, en, fr) are required' });
        }

        const data = await fs.readFile(TIPS_FILE, 'utf8');
        const tips = JSON.parse(data);
        
        // Get max ID
        const maxId = tips.reduce((max, tip) => Math.max(max, tip.id), 0);
        
        const newTip = {
            id: maxId + 1,
            ar,
            en,
            fr
        };
        
        tips.push(newTip);
        
        await fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf8');
        
        res.status(201).json({ message: 'Tip added successfully', tip: newTip });
    } catch (error) {
        console.error('Error adding tip:', error);
        res.status(500).json({ message: 'Error adding tip', error: error.message });
    }
};

// Update tip
exports.updateTip = async (req, res) => {
    try {
        const { id } = req.params;
        const { ar, en, fr } = req.body;
        
        if (!ar || !en || !fr) {
            return res.status(400).json({ message: 'All language fields (ar, en, fr) are required' });
        }

        const data = await fs.readFile(TIPS_FILE, 'utf8');
        const tips = JSON.parse(data);
        
        const tipIndex = tips.findIndex(t => t.id === parseInt(id));
        
        if (tipIndex === -1) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        
        tips[tipIndex] = {
            id: parseInt(id),
            ar,
            en,
            fr
        };
        
        await fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf8');
        
        res.json({ message: 'Tip updated successfully', tip: tips[tipIndex] });
    } catch (error) {
        console.error('Error updating tip:', error);
        res.status(500).json({ message: 'Error updating tip', error: error.message });
    }
};

// Delete tip
exports.deleteTip = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await fs.readFile(TIPS_FILE, 'utf8');
        let tips = JSON.parse(data);
        
        const tipIndex = tips.findIndex(t => t.id === parseInt(id));
        
        if (tipIndex === -1) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        
        tips = tips.filter(t => t.id !== parseInt(id));
        
        await fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf8');
        
        res.json({ message: 'Tip deleted successfully' });
    } catch (error) {
        console.error('Error deleting tip:', error);
        res.status(500).json({ message: 'Error deleting tip', error: error.message });
    }
};

// Update all tips (Bulk replace)
exports.updateAllTips = async (req, res) => {
    try {
        const tips = req.body;
        
        if (!Array.isArray(tips)) {
            return res.status(400).json({ message: 'Data must be an array of tips' });
        }

        await fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf8');
        
        res.json({ message: 'Tips updated successfully', count: tips.length });
    } catch (error) {
        console.error('Error updating all tips:', error);
        res.status(500).json({ message: 'Error updating tips', error: error.message });
    }
};
