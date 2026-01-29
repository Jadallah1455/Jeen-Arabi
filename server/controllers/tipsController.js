const fs = require('fs').promises;
const path = require('path');

const TIPS_FILE = path.join(__dirname, '../data/dailyTips.json');

// Helper to read and ensure structure
async function readTipsFile() {
    try {
        const data = await fs.readFile(TIPS_FILE, 'utf8');
        const json = JSON.parse(data);
        if (json && json.tips && Array.isArray(json.tips)) {
            return json;
        }
        return { tips: Array.isArray(json) ? json : [] };
    } catch (error) {
        return { tips: [] };
    }
}

// Get all tips
exports.getTips = async (req, res) => {
    try {
        const json = await readTipsFile();
        res.json(json.tips); // Return only the array to the frontend
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

        const json = await readTipsFile();
        const tips = json.tips;
        
        // Ensure all existing tips have IDs if they don't
        tips.forEach((tip, index) => {
            if (tip.id === undefined) tip.id = index + 1;
        });

        // Get max ID
        const maxId = tips.reduce((max, tip) => Math.max(max, tip.id || 0), 0);
        
        const newTip = {
            id: maxId + 1,
            ar,
            en,
            fr
        };
        
        tips.push(newTip);
        json.tips = tips;
        
        await fs.writeFile(TIPS_FILE, JSON.stringify(json, null, 2), 'utf8');
        
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

        const json = await readTipsFile();
        const tips = json.tips;
        
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
        
        json.tips = tips;
        await fs.writeFile(TIPS_FILE, JSON.stringify(json, null, 2), 'utf8');
        
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

        const json = await readTipsFile();
        let tips = json.tips;
        
        const tipIndex = tips.findIndex(t => t.id === parseInt(id));
        
        if (tipIndex === -1) {
            return res.status(404).json({ message: 'Tip not found' });
        }
        
        tips = tips.filter(t => t.id !== parseInt(id));
        json.tips = tips;
        
        await fs.writeFile(TIPS_FILE, JSON.stringify(json, null, 2), 'utf8');
        
        res.json({ message: 'Tip deleted successfully' });
    } catch (error) {
        console.error('Error deleting tip:', error);
        res.status(500).json({ message: 'Error deleting tip', error: error.message });
    }
};

// Update all tips (Bulk replace)
exports.updateAllTips = async (req, res) => {
    try {
        let tips = req.body;
        
        // If users provide the wrapper object, extract the array
        if (tips && !Array.isArray(tips) && Array.isArray(tips.tips)) {
            tips = tips.tips;
        }

        if (!Array.isArray(tips)) {
            return res.status(400).json({ message: 'Data must be an array of tips' });
        }

        // Save wrapped
        const json = { tips };
        await fs.writeFile(TIPS_FILE, JSON.stringify(json, null, 2), 'utf8');
        
        res.json({ message: 'Tips updated successfully', count: tips.length });
    } catch (error) {
        console.error('Error updating all tips:', error);
        res.status(500).json({ message: 'Error updating tips', error: error.message });
    }
};
