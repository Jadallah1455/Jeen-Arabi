const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('AI Instance created');

        const modelName = 'gemini-2.0-flash';
        console.log(`Testing model: ${modelName}`);

        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        console.log('Response:', result.response.text());

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
