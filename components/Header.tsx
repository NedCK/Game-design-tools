
import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface HeaderProps {
    onSettingsClick: () => void;
}

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.905c-.008.379.137.752.43.992l1.003.827c.424.35.534.955.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.127c-.331.183-.581.495-.644.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.905c.008-.379-.137-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.127.332-.183.582-.495.644-.87l.213-1.281Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const LanguageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
    const { t, language, setLanguage } = useLanguage();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
            <h1 className="text-xl font-bold tracking-wider text-purple-300">
                {t.header.title}
            </h1>
            <div className="flex items-center gap-4">
                 <div className="relative">
                    <LanguageIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="appearance-none bg-gray-700/50 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
                        aria-label="Change language"
                    >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                </div>
               
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
                    aria-label={t.header.settings}
                >
                    <SettingsIcon className="w-6 h-6 text-gray-300" />
                </button>
            </div>
        </header>
    );
};