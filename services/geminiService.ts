import api from './api';
import { Language } from '../types';

export const generateStoryFromDesign = async (
  title: string,
  elements: string[],
  language: Language
): Promise<string> => {
  try {
    const response = await api.post('/ai/generate-story', {
      title,
      elements,
      language
    });
    return response.data.story || "Could not generate story.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't write the story right now. Please try again later!";
  }
};