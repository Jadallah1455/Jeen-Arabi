// Language fallback utility for story titles and descriptions
export const getStoryText = (textObj: any, lang: string, field: 'title' | 'description' = 'title'): string => {
    if (!textObj) return field === 'title' ? 'Untitled' : 'No description';
    
    // Try current language
    if (textObj[lang]) return textObj[lang];
    
    // Fallback chain: ar -> en -> fr -> first available
    const fallbackOrder = ['ar', 'en', 'fr'];
    for (const fallbackLang of fallbackOrder) {
        if (textObj[fallbackLang]) return textObj[fallbackLang];
    }
    
    // Last resort: return first available value
    const values = Object.values(textObj).filter(v => typeof v === 'string' && v.trim());
    return values[0] as string || (field === 'title' ? 'Untitled' : 'No description');
};
