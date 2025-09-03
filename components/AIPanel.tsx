



import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';
import { RequirementCategory } from '../types';

// Icons
const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.5 17.25l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 13.5l.398 1.178a3.375 3.375 0 002.456 2.456l1.178.398-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

const ConsolidateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);


const TranslateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
);

const AlignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

interface AIPanelProps {
    onGenerateColumn: (timelineDescription: string) => void;
    onConsolidateUI: () => void;
    onRefine: (content: string) => void;
    onTranslate: (content: string) => void;
    onGenerateImage: (prompt: string) => void;
    onAlignColumn: () => void;
    suggestions: string;
    isLoading: boolean;
    loadingMessage: string;
    activeCell: { category: RequirementCategory | 'core' | 'timeline', rowIndex: number, colIndex: number } | null;
    activeCellContent: string;
    onUpdateActiveCellContent: (value: string) => void;
    activeCellSketchPrompt?: string;
    onUpdateActiveCellSketchPrompt?: (value: string) => void;
    activeTimelineStepName: string;
    activeTimelineDescription: string;
    onUpdateActiveTimelineDescription: (value: string) => void;
    gameConcept: string;
    onUpdateGameConcept: (value: string) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
    onGenerateColumn, onConsolidateUI, onRefine, onTranslate, onGenerateImage, onAlignColumn, suggestions, isLoading, loadingMessage,
    activeCell, activeCellContent, onUpdateActiveCellContent, activeCellSketchPrompt, onUpdateActiveCellSketchPrompt, activeTimelineStepName,
    activeTimelineDescription, onUpdateActiveTimelineDescription, gameConcept, onUpdateGameConcept
}) => {
    const { t } = useLanguage();
    
    const isTimelineSelected = activeCell?.category === 'timeline';
    const isRequirementCellSelected = activeCell && activeCell.category !== 'timeline' && activeCell.category !== 'core';
    const isStoryboardCellSelected = activeCell?.category === RequirementCategory.STORYBOARD;
    const isCoreCellSelected = activeCell?.category === 'core';

    const contentForPanel = isStoryboardCellSelected ? activeCellSketchPrompt : activeCellContent;
    const updateContentForPanel = isStoryboardCellSelected ? onUpdateActiveCellSketchPrompt : onUpdateActiveCellContent;


    const handleGenerateClick = () => {
        if (activeTimelineDescription) {
            onGenerateColumn(activeTimelineDescription);
        }
    };

    const handleRefineClick = () => {
        if (contentForPanel) {
            onRefine(contentForPanel);
        }
    };
    
    const handleTranslateClick = () => {
        if (contentForPanel) {
            onTranslate(contentForPanel);
        }
    };

    const handleGenerateImageClick = () => {
        if (contentForPanel) {
            onGenerateImage(contentForPanel);
        }
    };

    return (
        <aside className="w-96 bg-gray-800 p-4 overflow-y-auto flex flex-col gap-6 shadow-2xl border-l border-gray-700/50">
            <h2 className="text-lg font-semibold text-purple-300 border-b border-gray-700 pb-2">{t.aiPanel.title}</h2>
            
            {/* 1. Column Generation */}
            <div className={`transition-opacity ${!isTimelineSelected && !isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <div>
                    <h3 className="text-md font-semibold mb-2">{t.aiPanel.generateTitle}</h3>
                    <p className="text-xs text-gray-400 mb-2">
                        {isTimelineSelected 
                            ? `Selected: "${activeTimelineStepName}"`
                            : "Select a timeline header to begin."}
                    </p>
                    <textarea
                        value={activeTimelineDescription}
                        onChange={(e) => onUpdateActiveTimelineDescription(e.target.value)}
                        placeholder={t.aiPanel.generatePlaceholder}
                        className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors text-sm"
                        disabled={!isTimelineSelected || isLoading}
                    />
                    <button
                        onClick={handleGenerateClick}
                        disabled={!isTimelineSelected || isLoading || !activeTimelineDescription}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <GenerateIcon className="w-5 h-5" />
                        {t.aiPanel.generateButton}
                    </button>
                </div>
            </div>

             {/* 2. Cell Actions (Contextual) */}
            <div className={`transition-opacity ${!isRequirementCellSelected && !isCoreCellSelected && !isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <h3 className="text-md font-semibold mb-2">
                    {isStoryboardCellSelected ? t.aiPanel.imageGenerationTitle : t.aiPanel.refineTitle}
                </h3>
                <textarea
                    value={contentForPanel || ''}
                    onChange={(e) => updateContentForPanel?.(e.target.value)}
                    placeholder={isStoryboardCellSelected ? t.aiPanel.imageGenerationPlaceholder : t.aiPanel.refinePlaceholder}
                    className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors text-sm"
                    disabled={!isRequirementCellSelected || isLoading}
                />
                <div className="mt-2 grid grid-cols-1 gap-2">
                    {isStoryboardCellSelected ? (
                        <button
                            onClick={handleGenerateImageClick}
                            disabled={!isRequirementCellSelected || isLoading || !contentForPanel}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <ImageIcon className="w-5 h-5" />
                            {t.aiPanel.imageGenerationButton}
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleRefineClick}
                                disabled={!isRequirementCellSelected || isLoading || !contentForPanel}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                <GenerateIcon className="w-5 h-5" />
                                {t.aiPanel.refineButton}
                            </button>
                            <button
                                onClick={handleTranslateClick}
                                disabled={!isRequirementCellSelected || isLoading || !contentForPanel}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                <TranslateIcon className="w-5 h-5" />
                                {t.aiPanel.translateButton}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Game Concept Design */}
            <div>
                <h3 className="text-md font-semibold mb-2">{t.aiPanel.gameConceptTitle}</h3>
                <textarea
                    value={gameConcept}
                    onChange={(e) => onUpdateGameConcept(e.target.value)}
                    placeholder={t.aiPanel.gameConceptPlaceholder}
                    className="w-full h-32 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors text-sm"
                    disabled={isLoading}
                    aria-label={t.aiPanel.gameConceptTitle}
                />
            </div>

            {/* 4. UI Consolidation & Core Experience Alignment */}
            <div className={`transition-opacity ${!isTimelineSelected && !isCoreCellSelected && !isLoading ? 'opacity-50' : 'opacity-100'}`}>
                { isTimelineSelected && (
                    <div>
                        <h3 className="text-md font-semibold mb-2">{t.aiPanel.consolidateTitle}</h3>
                        <button
                            onClick={onConsolidateUI}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <ConsolidateIcon className="w-5 h-5" />
                            {t.aiPanel.consolidateButton}
                        </button>
                    </div>
                )}
                 { isCoreCellSelected && (
                    <div>
                        <h3 className="text-md font-semibold mb-2">{t.aiPanel.alignTitle}</h3>
                         <p className="text-xs text-gray-400 mb-2">
                            {t.aiPanel.alignDescription.replace('{stepName}', `"${activeTimelineStepName}"`)}
                        </p>
                        <button
                            onClick={onAlignColumn}
                            disabled={isLoading || !activeCellContent}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <AlignIcon className="w-5 h-5" />
                            {t.aiPanel.alignButton}
                        </button>
                    </div>
                )}
            </div>
            
            {/* 5. Suggestions Display */}
            <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-md font-semibold mb-2">{t.aiPanel.resultsTitle}</h3>
                <div className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-md overflow-y-auto text-sm prose prose-invert prose-sm max-w-none">
                    {isLoading && loadingMessage && <p className="text-gray-400 animate-pulse">{loadingMessage}</p>}
                    {!isLoading && suggestions && <ReactMarkdown>{suggestions}</ReactMarkdown>}
                    {!isLoading && !suggestions && <p className="text-gray-500 italic">{t.aiPanel.resultsPlaceholder}</p>}
                </div>
            </div>
        </aside>
    );
};