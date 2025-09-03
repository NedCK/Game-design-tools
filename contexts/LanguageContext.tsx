import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { translations } from '../localization/translations';

export type Language = 'en' | 'zh';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = localStorage.getItem('appLanguage');
        // Set default to Chinese if browser language is Chinese, otherwise English
        if (savedLang === 'zh' || savedLang === 'en') {
             return savedLang;
        }
        return navigator.language.startsWith('zh') ? 'zh' : 'en';
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);
    
    const t = useMemo(() => translations[language], [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};