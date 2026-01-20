import React, { createContext, useContext, useState } from 'react';

type Language = 'fr' | 'ar' | 'darija';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    fr: {
        'nav.dashboard': 'Tableau de bord',
        'nav.create': 'Créer une Daret',
        'nav.login': 'Se connecter',
        'common.welcome': 'Bienvenue',
    },
    ar: {
        'nav.dashboard': 'لوحة القيادة',
        'nav.create': 'إنشاء دارت',
        'nav.login': 'تسجيل الدخول',
        'common.welcome': 'مرحبا',
        'create.title': 'إنشاء دارت جديدة',
        'create.name': 'اسم المجموعة',
        'create.amount': 'المبلغ للشخص (درهم)',
        'create.period': 'الدورية',
        'create.start': 'تاريخ البدء',
        'create.submit': 'إنشاء المجموعة',
    },
    darija: {
        'nav.dashboard': 'لوحة التحكم', // Darija often uses simplified Arabic or Latin, usually Arabic script for official
        'nav.create': 'صاول دارت',
        'nav.login': 'دخل للحساب',
        'common.welcome': 'مرحبا بيك',
        'create.title': 'صاوب دارت جديدة',
        'create.name': 'سمية ديال لكروب',
        'create.amount': 'شحال للواحد (درهم)',
        'create.period': 'كل شحال',
        'create.start': 'فوقاش غانبداو',
        'create.submit': 'يلاه نبداو',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('fr');

    const t = (key: string) => {
        return (translations[language] as any)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            <div dir={language === 'fr' ? 'ltr' : 'rtl'} className={language === 'darija' ? 'font-darija' : ''}>
                {children}
            </div>
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
