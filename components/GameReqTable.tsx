import React from 'react';
import { GameTable, CoreExperienceRow, RequirementCategory, RequirementCell } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface GameReqTableProps {
    timeline: string[];
    timelineDescriptions: string[];
    gameTable: GameTable;
    coreExperience: CoreExperienceRow;
    onUpdateCell: (category: RequirementCategory, rowIndex: number, colIndex: number, field: keyof Omit<RequirementCell, 'id' | 'imageUrl'>, value: string) => void;
    onClearCell: (category: RequirementCategory, rowIndex: number, colIndex: number) => void;
    onUpdateCoreCell: (index: number, value: string) => void;
    onUpdateTimelineHeader: (index: number, value: string) => void;
    onUpdateTimelineDescription: (index: number, value: string) => void;
    onDeleteTimelineStep: (colIndex: number) => void;
    activeCell: { category: RequirementCategory | 'core' | 'timeline', rowIndex: number, colIndex: number } | null;
    onSelectCell: (category: RequirementCategory | 'core' | 'timeline', rowIndex: number, colIndex: number) => void;
    onGenerateTechImplementation: (category: RequirementCategory, rowIndex: number, colIndex: number) => void;
}

const EditableCell: React.FC<{ value: string; onSave: (value: string) => void; isHeader?: boolean; placeholder?: string; isTextarea?: boolean }> = React.memo(({ value, onSave, isHeader = false, placeholder = "...", isTextarea = false }) => {
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        onSave(e.currentTarget.innerText);
    };

    const baseClasses = "p-2 outline-none focus:bg-gray-700/50 rounded-md transition-all w-full flex-grow bg-transparent";
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

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const AddIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);


const StoryboardCellView: React.FC<{
    cellData: RequirementCell;
    onUpdate: (field: keyof Omit<RequirementCell, 'id' | 'imageUrl'>, value: string) => void;
    onGenerateTechImplementation: () => void;
    onClear: () => void;
}> = ({ cellData, onUpdate, onGenerateTechImplementation, onClear }) => {
    const { t } = useLanguage();
    const labels = t.table.storyboard;
    const isGenerationDisabled = !cellData?.shotTime && !cellData?.description && !cellData?.playerStatus;

    return (
        <div className="p-1 text-xs relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                className="absolute top-0 right-0 m-1 p-1 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 focus:opacity-100 focus:outline-none transition-opacity"
                aria-label={t.table.placeholders.deleteStoryboard}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
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
                <EditableCell value={cellData?.description || ''} onSave={(val) => onUpdate('description', val)} placeholder={t.table.placeholders.description} isTextarea />

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


export const GameReqTable: React.FC<GameReqTableProps> = ({ timeline, timelineDescriptions, gameTable, coreExperience, onUpdateCell, onClearCell, onUpdateCoreCell, onUpdateTimelineHeader, onUpdateTimelineDescription, onDeleteTimelineStep, activeCell, onSelectCell, onGenerateTechImplementation }) => {
    const { t } = useLanguage();
    const translatedCategories = t.categories;

    const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.currentTarget.classList.add('bg-purple-700/50');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.currentTarget.classList.remove('bg-purple-700/50');
    };

    return (
        <div className="flex-1 bg-gray-800 rounded-lg p-1 shadow-inner relative">
            <table className="w-full border-separate border-spacing-0">
                <thead>
                    {/* ROW 1: TITLES */}
                    <tr>
                        <th rowSpan={2} className="sticky left-0 top-0 z-40 bg-gray-800 p-2 font-bold text-gray-400 border border-gray-700 min-w-[200px] align-top">
                           {t.table.headerCorner}
                        </th>
                        {timeline.map((step, colIndex) => {
                            const isSelected = activeCell?.category === 'timeline' && activeCell?.colIndex === colIndex;
                            return (
                                <th 
                                    key={colIndex} 
                                    className={`group sticky top-0 z-30 bg-gray-800 p-1 border border-gray-700 min-w-[250px] h-12 transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                                    onClick={() => onSelectCell('timeline', 0, colIndex)}
                                >
                                     <div className="relative flex items-center h-full">
                                        <EditableCell
                                            value={step}
                                            onSave={(val) => onUpdateTimelineHeader(colIndex, val)}
                                            isHeader
                                            placeholder={t.table.placeholders.timelineTitle}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTimelineStep(colIndex);
                                            }}
                                            className="absolute top-1/2 -translate-y-1/2 right-0 m-1 p-1 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 focus:opacity-100 focus:outline-none transition-opacity"
                                            aria-label={t.table.placeholders.deleteStep.replace('{stepName}', step)}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                     </div>
                                </th>
                            );
                        })}
                    </tr>
                     {/* ROW 2: DESCRIPTIONS */}
                    <tr>
                        {timeline.map((_, colIndex) => {
                            const isSelected = activeCell?.category === 'timeline' && activeCell?.colIndex === colIndex;
                            return (
                                <th
                                    key={`desc-${colIndex}`}
                                    className={`sticky z-30 bg-gray-800 p-1 border border-gray-700 min-w-[250px] h-24 transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                                    style={{ top: '48px' }} // Height of first row (h-12 is 3rem/48px)
                                    onClick={() => onSelectCell('timeline', 0, colIndex)}
                                >
                                    <EditableCell
                                        value={timelineDescriptions[colIndex] || ''}
                                        onSave={(val) => onUpdateTimelineDescription(colIndex, val)}
                                        isHeader={false}
                                        placeholder={t.table.placeholders.timelineDescription}
                                        isTextarea={true}
                                    />
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
                                     <th scope="row" rowSpan={rowsForCategory.length} className="sticky left-0 z-20 bg-gray-800 p-2 border border-gray-700 text-left align-top">
                                        <div className="font-semibold text-purple-300">{translatedCategories[cat].name}</div>
                                        <div className="text-xs text-gray-400 font-normal">{translatedCategories[cat].description}</div>
                                    </th>
                                )}
                                {timeline.map((_, colIndex) => {
                                    const isSelected = activeCell?.category === cat && activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;
                                    const cellData = row[colIndex];
                                    const isStoryboard = cat === RequirementCategory.STORYBOARD;
                                    const storyboardHasContent = isStoryboard && cellData && cellData.id;

                                    const handleAddStoryboard = () => {
                                        // Using a non-whitespace character to trigger ID generation in App.tsx
                                        onUpdateCell(cat, rowIndex, colIndex, 'shotTime', '-');
                                        onSelectCell(cat, rowIndex, colIndex);
                                    };
                                    
                                    const handleDrop = (e: React.DragEvent<HTMLTableCellElement>) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-purple-700/50');
                                        const droppedText = e.dataTransfer.getData('text/plain');
                                        if (droppedText) {
                                            const currentDescription = cellData?.description || '';
                                            const newDescription = currentDescription ? `${currentDescription}\n${droppedText}` : droppedText;
                                            onUpdateCell(cat, rowIndex, colIndex, 'description', newDescription);
                                            onSelectCell(cat, rowIndex, colIndex);
                                        }
                                    };

                                    return (
                                        <td 
                                            key={`${cat}-${rowIndex}-${colIndex}`} 
                                            className={`group bg-gray-800 p-1 border border-gray-700 align-top transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500 z-10 relative' : ''}`}
                                            onClick={isStoryboard && !storyboardHasContent ? handleAddStoryboard : () => onSelectCell(cat, rowIndex, colIndex)}
                                            onDragOver={handleDragOver}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {isStoryboard ? (
                                                storyboardHasContent ? (
                                                    <StoryboardCellView
                                                        cellData={cellData}
                                                        onUpdate={(field, value) => onUpdateCell(cat, rowIndex, colIndex, field, value)}
                                                        onGenerateTechImplementation={() => onGenerateTechImplementation(cat, rowIndex, colIndex)}
                                                        onClear={() => onClearCell(cat, rowIndex, colIndex)}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full min-h-[60px]">
                                                        <div
                                                            className="p-2 text-gray-400 rounded-full group-hover:bg-purple-700/50 group-hover:text-white transition-colors"
                                                            aria-label={t.table.placeholders.addStoryboard}
                                                        >
                                                            <AddIcon className="w-6 h-6" />
                                                        </div>
                                                    </div>
                                                )
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
                        <th scope="row" className="sticky left-0 z-20 bg-gray-800 p-2 border border-gray-700 text-left align-top">
                            <div className="font-semibold text-yellow-300">{t.table.coreExperience}</div>
                        </th>
                         {timeline.map((_, index) => {
                             const isSelected = activeCell?.category === 'core' && activeCell?.colIndex === index;
                             const cellData = coreExperience[index];
                             
                             const handleDrop = (e: React.DragEvent<HTMLTableCellElement>) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('bg-purple-700/50');
                                const droppedText = e.dataTransfer.getData('text/plain');
                                if (droppedText) {
                                    const currentDescription = cellData?.description || '';
                                    const newDescription = currentDescription ? `${currentDescription}\n${droppedText}` : droppedText;
                                    onUpdateCoreCell(index, newDescription);
                                    onSelectCell('core', 0, index);
                                }
                            };

                            return (
                                <td 
                                    key={`core-${index}`} 
                                    className={`bg-gray-800 p-1 border border-gray-700 align-top transition-all cursor-pointer hover:bg-gray-700/30 ${isSelected ? 'ring-2 ring-purple-500 z-10 relative' : ''}`}
                                    onClick={() => onSelectCell('core', 0, index)}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
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