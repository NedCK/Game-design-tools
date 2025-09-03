

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AddIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ExportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" transform="rotate(180 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 19.375V15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
    </svg>
);


const LoadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v3.026m-12 1.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
    </svg>
);


interface ToolbarProps {
    onAddTimelineStep: () => void;
    onExport: (format: 'csv' | 'md') => void;
    onSaveToFile: () => void;
    onLoadFromFile: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddTimelineStep, onExport, onSaveToFile, onLoadFromFile }) => {
    const { t } = useLanguage();
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    return (
        <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
            <button
                onClick={onAddTimelineStep}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors"
            >
                <AddIcon className="w-5 h-5" />
                {t.toolbar.addStep}
            </button>
            <div className="flex items-center gap-2">
                <button
                    onClick={onSaveToFile}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                >
                    <SaveIcon className="w-5 h-5" />
                    {t.toolbar.saveProject}
                </button>
                <button
                    onClick={onLoadFromFile}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                >
                    <LoadIcon className="w-5 h-5" />
                    {t.toolbar.loadProject}
                </button>
            </div>
            <div className="relative">
                <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
                >
                    <ExportIcon className="w-5 h-5" />
                    {t.toolbar.export}
                </button>
                {isExportMenuOpen && (
                    <div
                        className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-40"
                        onMouseLeave={() => setIsExportMenuOpen(false)}
                    >
                        <button
                            onClick={() => { onExport('csv'); setIsExportMenuOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            {t.toolbar.exportCSV}
                        </button>
                        <button
                            onClick={() => { onExport('md'); setIsExportMenuOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            {t.toolbar.exportMD}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};