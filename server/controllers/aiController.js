const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Generate a story using Gemini
// @route   POST /api/ai/generate-story
// @access  Public (or protected if needed)
const generateStory = async (req, res) => {
    const { title, elements, language } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing in server environment variables.');
        return res.status(500).json({ message: 'Server configuration error: API Key missing.' });
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `
    You are a children's book author. Write a very short, engaging story (max 150 words) suitable for children aged 6-8.
    
    Title: "${title}"
    Key Elements involved: ${elements.join(', ')}.
    Language: ${language === 'ar' ? 'Arabic' : 'English'}.
    
    If the language is Arabic, ensure it is simple, vocalized (Tashkeel if possible) and suitable for kids.
    The tone should be warm, educational, and fun.
  `;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Updated to available model
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ story: text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ message: 'Failed to generate story. Please try again later.' });
    }
};

module.exports = {
    generateStory,
};
