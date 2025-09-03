
import React from 'react';
import { GameTable, CoreExperienceRow, RequirementCategory, RequirementCell } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface GameReqTableProps {
    timeline: string[];
    gameTable: GameTable;
    coreExperience: CoreExperienceRow;
    onUpdateCell: (category: RequirementCategory, rowIndex: number, colIndex: number, field: keyof Omit<RequirementCell, 'id' | 'imageUrl'>, value: string) => void;
    onUpdateCoreCell: (index: number, value: string) => void;
    onUpdateTimelineHeader: (index: number, value: string) => void;
    activeCell: { category: RequirementCategory | 'core' | 'timeline', rowIndex: number, colIndex: number } | null;
    onSelectCell: (category: RequirementCategory | 'core' | 'timeline', rowIndex: number, colIndex: number) => void;
    onGenerateTechImplementation: (category: RequirementCategory, rowIndex: number, colIndex: number) => void;
}

const EditableCell: React.FC<{ value: string; onSave: (value: string) => void; isHeader?: boolean; placeholder?: string; isTextarea?: boolean }> = React.memo(({ value, onSave, isHeader = false, placeholder = "...", isTextarea = false }) => {
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        onSave(e.currentTarget.innerText);
    };

    const baseClasses = "p-2 outline-none focus:bg-gray-700/50 rounded-md transition-all w-full flex-grow bg-gray-900/50";
    const headerClasses = isHeader ? "font-bold text-purple-300" : "text-gray-300";
    const placeholderClasses = "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:italic";
    const minHeightClass = isTextarea ? "min-h-[60px]" : "";

    return (
        <div
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            dangerouslySetInnerHTML={{ __html: value }}
            className={`${baseClasses} ${headerClasses} ${placeholderClasses} ${minHeightClass}`}
            data-placeholder={placeholder}
        ></div>
    );
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.placeholder === nextProps.placeholder);


const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.5 17.25l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 13.5l.398 1.178a3.375 3.375 0 002.456 2.456l1.178.398-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const StoryboardCellView: React.FC<{
    cellData: RequirementCell;
    onUpdate: (field: keyof Omit<RequirementCell, 'id' | 'imageUrl'>, value: string) => void;
    onGenerateTechImplementation: () => void;
}> = ({ cellData, onUpdate, onGenerateTechImplementation }) => {
    const { t } = useLanguage();
    const labels = t.table.storyboard;
    const isGenerationDisabled = !cellData?.shotTime && !cellData?.description && !cellData?.playerStatus;

    return (
        <div className="p-1 text-xs">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-400">{labels.id}:</span>
                <span className="font-mono text-gray-500">{cellData?.id}</span>
            </div>
            <div className="grid grid-cols-[max-content,1fr] gap-x-2 gap-y-1 items-center">
                {/* Row 1: Shot Time */}
                <label className="font-semibold text-gray-400 text-right">{labels.shotTime}:</label>
                <EditableCell value={cellData?.shotTime || ''} onSave={(val) => onUpdate('shotTime', val)} placeholder="..." />

                {/* Row 2: Scene Description */}
                <label className="font-semibold text-gray-400 text-right self-start pt-2">{labels.sceneDescription}:</label>
                <EditableCell value={cellData?.description || ''} onSave={(val) => onUpdate('description', val)} placeholder="..." isTextarea />

                {/* Row 3: Player Status */}
                <label className="font-semibold text-gray-400 text-right">{labels.playerStatus}:</label>
                <EditableCell value={cellData?.playerStatus || ''} onSave={(val) => onUpdate('playerStatus', val)} placeholder="..." />

                {/* Row 4: Tech Implementation */}
                <div className="flex items-start justify-end gap-1 pt-2">
                    <label className="font-semibold text-gray-400 text-right">{labels.techImplementation}:</label>
                    <button
                        onClick={onGenerateTechImplementation}
                        disabled={isGenerationDisabled}
                        className="p-0.5 rounded-md text-purple-400 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                        title={isGenerationDisabled ? t.table.placeholders.techGenDisabled : t.table.placeholders.techGenEnabled}
                        aria-label={t.table.placeholders.techGenEnabled}
                    >
                        <GenerateIcon className="w-4 h-4" />
                    </button>
                </div>
                <EditableCell value={cellData?.techImplementation || ''} onSave={(val) => onUpdate('techImplementation', val)} placeholder="..." isTextarea />

                {/* Row 5: Sketch */}
                <label className="font-semibold text-gray-400 text-right self-start pt-2">{labels.sketch}:</label>
                <div>
                    <div className="flex-grow flex items-center justify-center p-1 min-h-[120px]">
                        {cellData?.imageUrl ? (
                            <img src={cellData.imageUrl} alt={cellData.sketchPrompt} className="max-w-full max-h-[150px] object-contain rounded-md" />
                        ) : (
                            <div className="w-full h-[120px] bg-gray-700/50 rounded-md flex items-center justify-center text-gray-500 text-xs text-center p-2">
                                {t.table.placeholders.image}
                            </div>
                        )}
                    </div>
                    <EditableCell value={cellData?.sketchPrompt || ''} onSave={(val) => onUpdate('sketchPrompt', val)} placeholder={t.table.placeholders.prompt} isTextarea />
                </div>
            </div>
        </div>
    );
}


export const GameReqTable: React.FC<GameReqTableProps> = ({ timeline, gameTable, coreExperience, onUpdateCell, onUpdateCoreCell, onUpdateTimelineHeader, activeCell, onSelectCell, onGenerateTechImplementation }) => {
    const { t } = useLanguage();
    const translatedCategories = t.categories;

    return (
        <div className="flex-1 bg-gray-800 rounded-lg p-1 shadow-inner relative">
            <table className="w-full border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="sticky left-0 top-0 z-30 bg-gray-800 p-2 font-bold text-gray-400 border border-gray-700 min-w-[200px]">
                           {t.table.headerCorner}
                        </th>
                        {timeline.map((step, colIndex) => {
                            const isSelected = activeCell?.category === 'timeline' && activeCell?.colIndex === colIndex;
                            return (
                                <th 
                                    key={colIndex} 
                                    className={`sticky top-0 z-20 bg-gray-800 p-1 border border-gray-700 min-w-[250px] transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500 z-20 relative' : ''}`}
                                    onClick={() => onSelectCell('timeline', 0, colIndex)}
                                >
                                     <EditableCell value={step} onSave={(val) => onUpdateTimelineHeader(colIndex, val)} isHeader />
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {Object.values(RequirementCategory).map((cat) => {
                        const rowsForCategory = gameTable[cat] || [];
                        return rowsForCategory.map((row, rowIndex) => (
                             <tr key={`${cat}-${rowIndex}`}>
                                {rowIndex === 0 && (
                                     <th scope="row" rowSpan={rowsForCategory.length} className="sticky left-0 z-10 bg-gray-800 p-2 border border-gray-700 text-left align-top">
                                        <div className="font-semibold text-purple-300">{translatedCategories[cat].name}</div>
                                        <div className="text-xs text-gray-400 font-normal">{translatedCategories[cat].description}</div>
                                    </th>
                                )}
                                {timeline.map((_, colIndex) => {
                                    const isSelected = activeCell?.category === cat && activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;
                                    const cellData = row[colIndex];
                                    return (
                                        <td 
                                            key={`${cat}-${rowIndex}-${colIndex}`} 
                                            className={`p-1 border border-gray-700 align-top transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500 z-30 relative' : ''}`}
                                            onClick={() => onSelectCell(cat, rowIndex, colIndex)}
                                        >
                                            {cat === RequirementCategory.STORYBOARD ? (
                                                <StoryboardCellView
                                                    cellData={cellData}
                                                    onUpdate={(field, value) => onUpdateCell(cat, rowIndex, colIndex, field, value)}
                                                    onGenerateTechImplementation={() => onGenerateTechImplementation(cat, rowIndex, colIndex)}
                                                />
                                            ) : (
                                                <div className="flex flex-col h-full min-h-[60px]">
                                                    <span className="text-xs font-mono text-gray-500 px-1 pt-1">{cellData?.id}</span>
                                                    <EditableCell 
                                                        value={cellData?.description || ''} 
                                                        onSave={(val) => onUpdateCell(cat, rowIndex, colIndex, 'description', val)}
                                                        placeholder={t.table.placeholders.description}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    })}
                    
                    <tr>
                        <th scope="row" className="sticky left-0 z-10 bg-gray-800 p-2 border border-gray-700 text-left align-top">
                            <div className="font-semibold text-yellow-300">{t.table.coreExperience}</div>
                        </th>
                         {timeline.map((_, index) => {
                             const isSelected = activeCell?.category === 'core' && activeCell?.colIndex === index;
                             const cellData = coreExperience[index];
                            return (
                                <td 
                                    key={`core-${index}`} 
                                    className={`p-1 border border-gray-700 align-top transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500 z-30 relative' : ''}`}
                                    onClick={() => onSelectCell('core', 0, index)}
                                >
                                     <div className="flex flex-col h-full min-h-[60px]">
                                        <EditableCell 
                                            value={cellData?.description || ''} 
                                            onSave={(val) => onUpdateCoreCell(index, val)}
                                            placeholder={t.table.placeholders.coreExperience}
                                        />
                                     </div>
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
