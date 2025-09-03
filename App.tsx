
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { GameReqTable } from './components/GameReqTable';
import { AIPanel } from './components/AIPanel';
import { SettingsModal } from './components/SettingsModal';
import { Notification } from './components/Notification';
import { refineCellContent, getCoreExperienceAlignmentSuggestions, generateColumnRequirements, translateToChinese, consolidateUIRequirementsForColumn, generateImage, generateTechImplementation } from './services/geminiService';
import { exportToCSV, exportToMarkdown } from './services/exportService';
import { GameTable, CoreExperienceRow, ApiKey, AIProvider, RequirementCategory, NotificationMessage, RequirementRow, GameEngine, RequirementCell } from './types';
import { CATEGORY_STATIC_DETAILS } from './constants';
import { useLanguage } from './contexts/LanguageContext';

const generateInitialTable = (timeline: string[]): { table: GameTable; core: CoreExperienceRow } => {
    const table: GameTable = {
        [RequirementCategory.STORY]: [],
        [RequirementCategory.ART]: [],
        [RequirementCategory.INTERACTION]: [],
        [RequirementCategory.SYSTEM]: [],
        [RequirementCategory.AUDIO]: [],
        [RequirementCategory.UI_SYSTEM]: [],
        [RequirementCategory.STORYBOARD]: [],
    };
    const core: CoreExperienceRow = {};

    Object.values(RequirementCategory).forEach(category => {
        const newRow: RequirementRow = {};
        timeline.forEach((_, index) => {
            newRow[index] = { id: '', description: '' };
        });
        table[category] = [newRow];
    });
    timeline.forEach((_, index) => {
        core[index] = { description: '' };
    });

    return { table, core };
};

const getNextRequirementId = (category: RequirementCategory, table: GameTable): string => {
    const prefix = CATEGORY_STATIC_DETAILS[category].prefix;
    const allCellsInCategory = (table[category] || []).flatMap(row => Object.values(row));

    const ids = allCellsInCategory
        .map(cell => cell.id)
        .filter(id => id && id.startsWith(prefix + '-'));

    let maxNum = 0;
    ids.forEach(id => {
        const numPart = parseInt(id.split('-')[1], 10);
        if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
        }
    });

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    return `${prefix}-${paddedNum}`;
};


const App: React.FC = () => {
    const { t } = useLanguage();
    const [timeline, setTimeline] = useState<string[]>([]);
    const [gameTable, setGameTable] = useState<GameTable>(generateInitialTable([]).table);
    const [coreExperience, setCoreExperience] = useState<CoreExperienceRow>(generateInitialTable([]).core);
    const [timelineDescriptions, setTimelineDescriptions] = useState<string[]>([]);
    const [gameConcept, setGameConcept] = useState<string>('');
    const [aiSuggestions, setAiSuggestions] = useState<string>('');
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.GEMINI);
    const [selectedEngine, setSelectedEngine] = useState<GameEngine>(GameEngine.UNITY);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [notification, setNotification] = useState<NotificationMessage | null>(null);
    const [activeCell, setActiveCell] = useState<{ category: RequirementCategory | 'core' | 'timeline'; rowIndex: number; colIndex: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFullState = useCallback(() => {
        return {
            timeline,
            gameTable,
            coreExperience,
            timelineDescriptions,
            gameConcept,
            selectedEngine
        };
    }, [timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, selectedEngine]);

    const loadState = (loadedData: any) => {
        if (!loadedData) return;
        const { timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, selectedEngine } = loadedData;
        if (timeline) setTimeline(timeline);
        if (gameTable) setGameTable(gameTable);
        if (coreExperience) setCoreExperience(coreExperience);
        if (timelineDescriptions) setTimelineDescriptions(timelineDescriptions);
        if (gameConcept) setGameConcept(gameConcept);
        if (selectedEngine) setSelectedEngine(selectedEngine);
    };

    // Load initial data from local storage or set defaults
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('gameReqFullState');
            const savedKeys = localStorage.getItem('gameReqApiKeys');

            if (savedState) {
                const parsedState = JSON.parse(savedState);
                loadState(parsedState);
            } else {
                 const initialTimeline = t.initialTimeline;
                 const { table, core } = generateInitialTable(initialTimeline);
                 setTimeline(initialTimeline);
                 setGameTable(table);
                 setCoreExperience(core);
                 setTimelineDescriptions(Array(initialTimeline.length).fill(''));
            }

            if (savedKeys) setApiKeys(JSON.parse(savedKeys));

        } catch (error) {
            console.error("Failed to load from local storage", error);
            setNotification({ type: 'error', message: t.notifications.loadFailed });
        }
    }, [t]);

    // Save to local storage
    const saveState = useCallback(() => {
        try {
            const fullState = getFullState();
            localStorage.setItem('gameReqFullState', JSON.stringify(fullState));
            localStorage.setItem('gameReqApiKeys', JSON.stringify(apiKeys));
        } catch (error) {
            console.error("Failed to save state", error);
            setNotification({ type: 'error', message: t.notifications.saveFailed });
        }
    }, [getFullState, apiKeys, t.notifications.saveFailed]);

    // Debounced save effect
    useEffect(() => {
        const handler = setTimeout(() => {
            saveState();
        }, 2000);
        return () => clearTimeout(handler);
    }, [timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, selectedEngine, apiKeys, saveState]);

    const handleSaveToFile = () => {
        try {
            const fullState = getFullState();
            const jsonString = JSON.stringify(fullState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'aigamearchitect_project.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setNotification({ type: 'success', message: t.notifications.projectSaved });
        } catch (error) {
            console.error("Failed to save project to file", error);
            setNotification({ type: 'error', message: t.notifications.projectSaveFailed });
        }
    };

    const handleLoadFromFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const parsedState = JSON.parse(text);
                    loadState(parsedState);
                    setNotification({ type: 'success', message: t.notifications.projectLoaded });
                }
            } catch (error) {
                console.error("Failed to load project from file", error);
                setNotification({ type: 'error', message: t.notifications.projectLoadFailed });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleAddTimelineStep = () => {
        const newStepName = `New Step ${timeline.length + 1}`;
        const newIndex = timeline.length;

        setTimeline(prev => [...prev, newStepName]);
        setTimelineDescriptions(prev => [...prev, '']);

        setGameTable(prev => {
            const newTable = { ...prev };
            Object.values(RequirementCategory).forEach(cat => {
                newTable[cat] = newTable[cat].map(row => {
                    const newRow = { ...row };
                    newRow[newIndex] = { id: '', description: '' };
                    return newRow;
                });
            });
            return newTable;
        });

        setCoreExperience(prev => ({
            ...prev,
            [newIndex]: { description: '' }
        }));
    };

    const handleUpdateCell = (
        category: RequirementCategory,
        rowIndex: number,
        colIndex: number,
        field: keyof Omit<RequirementCell, 'id' | 'imageUrl'>,
        value: string
    ) => {
        setGameTable(prev => {
            const newTable = { ...prev };
            const newRows = [...newTable[category]];
            const newRow = { ...newRows[rowIndex] };
            const existingCell = newRow[colIndex] || { id: '', description: '' };
            const newCell = { ...existingCell, [field]: value };

            const hasContent =
                newCell.description?.trim() ||
                newCell.shotTime?.trim() ||
                newCell.playerStatus?.trim() ||
                newCell.techImplementation?.trim() ||
                newCell.sketchPrompt?.trim() ||
                newCell.imageUrl;

            if (!hasContent) {
                newCell.id = '';
            } else if (!existingCell.id) {
                newCell.id = getNextRequirementId(category, prev);
            }

            newRow[colIndex] = newCell;
            newRows[rowIndex] = newRow;
            newTable[category] = newRows;
            return newTable;
        });
    };
    
    const handleUpdateCoreCell = (index: number, value: string) => {
        setCoreExperience(prev => ({
            ...prev,
            [index]: { ...prev[index], description: value }
        }));
    };

    const handleUpdateTimelineHeader = (index: number, value: string) => {
        setTimeline(prev => {
            const newTimeline = [...prev];
            newTimeline[index] = value;
            return newTimeline;
        });
    };
    
    const handleUpdateTimelineDescription = (index: number, value: string) => {
        setTimelineDescriptions(prev => {
            const newDescriptions = [...prev];
            newDescriptions[index] = value;
            return newDescriptions;
        });
    };
    
    const handleUpdateActiveCellValue = (value: string) => {
        if (!activeCell || activeCell.category === 'timeline') return;

        if (activeCell.category === 'core') {
            handleUpdateCoreCell(activeCell.colIndex, value);
        } else {
            handleUpdateCell(activeCell.category, activeCell.rowIndex, activeCell.colIndex, 'description', value);
        }
    };

    const handleGenerateColumnRequirements = async (timelineDescription: string) => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category !== 'timeline') {
            setNotification({ type: 'error', message: t.notifications.selectCellToRefine });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Generating column requirements...');
        try {
            const { colIndex } = activeCell;
            const timelineStepName = timeline[colIndex];
            
            const result = await generateColumnRequirements(apiKey, timelineStepName, timelineDescription, t.categories as Record<RequirementCategory, {name: string}>, selectedEngine);
            
            setGameTable(prev => {
                const newTable = JSON.parse(JSON.stringify(prev));

                Object.values(RequirementCategory).forEach(cat => {
                    if (!result[cat] || result[cat].length === 0 || cat === RequirementCategory.UI_SYSTEM || cat === RequirementCategory.STORYBOARD) {
                        newTable[cat].forEach((row: RequirementRow) => {
                            if (row[colIndex]) {
                                row[colIndex] = { id: '', description: '' };
                            }
                        });
                    }
                });

                Object.keys(result).forEach(catKey => {
                    const category = catKey as RequirementCategory;
                    if (category === RequirementCategory.UI_SYSTEM || category === RequirementCategory.STORYBOARD) return;
                    const newDescriptions = result[category];
                    if (!newDescriptions || newDescriptions.length === 0) return;

                    newTable[category].forEach((row: RequirementRow) => {
                        row[colIndex] = { id: '', description: '' };
                    });

                    const rowsNeeded = newDescriptions.length;
                    const rowsExist = newTable[category].length;
                    if (rowsNeeded > rowsExist) {
                        for (let i = 0; i < rowsNeeded - rowsExist; i++) {
                            const newEmptyRow: RequirementRow = {};
                            timeline.forEach((_, tIndex) => {
                                newEmptyRow[tIndex] = { id: '', description: '' };
                            });
                            newTable[category].push(newEmptyRow);
                        }
                    }

                    newDescriptions.forEach((item, rowIndex) => {
                        const newId = getNextRequirementId(category, newTable);
                        newTable[category][rowIndex][colIndex] = {
                            id: newId,
                            description: item.description
                        };
                    });
                });
                return newTable;
            });
            setNotification({ type: 'success', message: t.notifications.columnGenerated });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.columnGenerationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleConsolidateUIRequirements = async () => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category !== 'timeline') {
            setNotification({ type: 'error', message: "Please select a timeline column header to consolidate UI." });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Consolidating UI requirements...');
        try {
            const { colIndex } = activeCell;
            const timelineStepName = timeline[colIndex];
            
            const columnData: Record<string, string> = {};
            Object.values(RequirementCategory).forEach(cat => {
                if (cat === RequirementCategory.UI_SYSTEM || cat === RequirementCategory.STORYBOARD) return;
                const categoryName = t.categories[cat].name;
                const descriptions = (gameTable[cat] || [])
                    .map(row => row[colIndex]?.description)
                    .filter(Boolean)
                    .join('\n- ');
                if (descriptions) {
                    columnData[categoryName] = "- " + descriptions;
                }
            });

            const result = await consolidateUIRequirementsForColumn(apiKey, selectedEngine, timelineStepName, columnData);
            
            setGameTable(prev => {
                const newTable = JSON.parse(JSON.stringify(prev));
                const uiCategory = RequirementCategory.UI_SYSTEM;
                const newUIDescriptions = result[uiCategory] || [];

                newTable[uiCategory].forEach((row: RequirementRow) => {
                    row[colIndex] = { id: '', description: '' };
                });

                const rowsNeeded = newUIDescriptions.length;
                const rowsExist = newTable[uiCategory].length;
                if (rowsNeeded > rowsExist) {
                    for (let i = 0; i < rowsNeeded - rowsExist; i++) {
                        const newEmptyRow: RequirementRow = {};
                        timeline.forEach((_, tIndex) => { newEmptyRow[tIndex] = { id: '', description: '' }; });
                        newTable[uiCategory].push(newEmptyRow);
                    }
                }
                
                newUIDescriptions.forEach((item, rowIndex) => {
                    const newId = getNextRequirementId(uiCategory, newTable);
                    newTable[uiCategory][rowIndex][colIndex] = {
                        id: newId,
                        description: item.description
                    };
                });

                return newTable;
            });

            setNotification({ type: 'success', message: t.notifications.uiConsolidated });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.uiConsolidationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };


    const handleRefineCellWithAI = async (content: string) => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category === 'timeline') {
            setNotification({ type: 'error', message: t.notifications.selectCellToRefine });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Refining cell content...');
        try {
            const { category, colIndex } = activeCell;
            const categoryName = category === 'core' ? t.table.coreExperience : t.categories[category].name;
            const timelineStep = timeline[colIndex];

            const result = await refineCellContent(apiKey, content, categoryName, timelineStep, selectedEngine);
            
            handleUpdateActiveCellValue(result);
            setNotification({ type: 'success', message: t.notifications.cellRefined });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.generationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleTranslateCellWithAI = async (content: string) => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category === 'timeline') {
            setNotification({ type: 'error', message: t.notifications.selectCellToRefine });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Translating content...');
        try {
            const result = await translateToChinese(apiKey, content);
            handleUpdateActiveCellValue(result);
            setNotification({ type: 'success', message: t.notifications.translationSuccess });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.translationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleGenerateImage = async (prompt: string) => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category !== RequirementCategory.STORYBOARD) {
            setNotification({ type: 'error', message: t.notifications.selectImageCell });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Generating storyboard image...');
        try {
            const resultUrl = await generateImage(apiKey, prompt, gameConcept);
            const { category, rowIndex, colIndex } = activeCell;

            setGameTable(prev => {
                const newTable = { ...prev };
                const newRows = [...newTable[category]];
                const newRow = { ...newRows[rowIndex]};
                const existingCell = newRow[colIndex] || { id: '', description: '', sketchPrompt: prompt };
                const newCell = { ...existingCell, imageUrl: resultUrl, sketchPrompt: prompt };
                
                if (!existingCell.id) {
                    newCell.id = getNextRequirementId(category, prev);
                }

                newRow[colIndex] = newCell;
                newRows[rowIndex] = newRow;
                newTable[category] = newRows;
                return newTable;
            });

            setNotification({ type: 'success', message: t.notifications.imageGenerated });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.imageGenerationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleGenerateTechImplementation = async (category: RequirementCategory, rowIndex: number, colIndex: number) => {
        if (category !== RequirementCategory.STORYBOARD) return;

        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }

        const cell = gameTable[category]?.[rowIndex]?.[colIndex];
        if (!cell || (!cell.shotTime && !cell.description && !cell.playerStatus)) {
            setNotification({ type: 'error', message: t.notifications.storyboardInfoMissing });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Generating technical implementation...');
        try {
            const { shotTime, description, playerStatus } = cell;
            const result = await generateTechImplementation(apiKey, selectedEngine, shotTime || '', description || '', playerStatus || '');
            
            handleUpdateCell(category, rowIndex, colIndex, 'techImplementation', result);
            setNotification({ type: 'success', message: t.notifications.techImplementationGenerated });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.techImplementationFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleAlignColumnWithCoreExperience = async () => {
        const apiKey = apiKeys.find(k => k.provider === selectedProvider)?.key;
        if (!apiKey) {
            setNotification({ type: 'error', message: t.notifications.apiKeyNotSet });
            setIsSettingsOpen(true);
            return;
        }
        if (!activeCell || activeCell.category !== 'core') {
            setNotification({ type: 'error', message: 'Please select a core experience cell first.' });
            return;
        }

        const { colIndex } = activeCell;
        const coreExperienceForStep = coreExperience[colIndex]?.description;
        if (!coreExperienceForStep || coreExperienceForStep.trim() === '') {
            setNotification({ type: 'info', message: 'Please describe the core experience for this step before getting suggestions.' });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Aligning column with core experience...');
        try {
            const timelineStepName = timeline[colIndex];
            const categoriesToAnalyze: RequirementCategory[] = [
                RequirementCategory.STORY,
                RequirementCategory.ART,
                RequirementCategory.INTERACTION,
                RequirementCategory.AUDIO,
                RequirementCategory.STORYBOARD
            ];

            const columnData: Partial<Record<RequirementCategory, string>> = {};

            categoriesToAnalyze.forEach(cat => {
                const rowsForCategory = gameTable[cat] || [];
                const descriptions = rowsForCategory.map(row => {
                    const cell = row[colIndex];
                    if (!cell) return null;
                    return cell.description || null; // For storyboard, we are specifically asked to check its description field
                }).filter(d => d && d.trim() !== '').join('; ');

                if (descriptions) {
                    columnData[cat] = descriptions;
                }
            });
            
            const result = await getCoreExperienceAlignmentSuggestions(apiKey, coreExperienceForStep, timelineStepName, columnData, selectedEngine);
            setAiSuggestions(result);
            setNotification({ type: 'success', message: t.notifications.suggestionsReceived });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setNotification({ type: 'error', message: t.notifications.suggestionFailed.replace('{error}', errorMessage) });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleExport = (format: 'csv' | 'md') => {
        if (format === 'csv') {
            exportToCSV(timeline, gameTable, coreExperience, t);
            setNotification({ type: 'success', message: t.notifications.exportedCSV });
        } else {
            exportToMarkdown(timeline, gameTable, coreExperience, t);
            setNotification({ type: 'success', message: t.notifications.exportedMD });
        }
    };
    
    let activeCellContent = '';
    let activeCellSketchPrompt: string | undefined = undefined;

    if (activeCell && activeCell.category !== 'timeline') {
        if (activeCell.category === 'core') {
            activeCellContent = coreExperience[activeCell.colIndex]?.description || '';
        } else {
             const cell = gameTable[activeCell.category]?.[activeCell.rowIndex]?.[activeCell.colIndex];
             if (cell) {
                activeCellContent = cell.description || '';
                if (activeCell.category === RequirementCategory.STORYBOARD) {
                    activeCellSketchPrompt = cell.sketchPrompt || '';
                }
             }
        }
    }

    const activeTimelineStepName = activeCell ? timeline[activeCell.colIndex] : '';
    const activeTimelineDescription = (activeCell?.category === 'timeline' && timelineDescriptions[activeCell.colIndex] !== undefined)
        ? timelineDescriptions[activeCell.colIndex]
        : '';

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept=".json,application/json"
                style={{ display: 'none' }}
            />
            <Header
                onSettingsClick={() => setIsSettingsOpen(true)}
            />
            <main className="flex flex-1 overflow-hidden">
                <div className="flex flex-col flex-1 p-4 gap-4 overflow-x-auto">
                    <Toolbar 
                        onAddTimelineStep={handleAddTimelineStep} 
                        onExport={handleExport}
                        onSaveToFile={handleSaveToFile}
                        onLoadFromFile={handleLoadFromFileClick}
                    />
                    <GameReqTable 
                        timeline={timeline}
                        gameTable={gameTable}
                        coreExperience={coreExperience}
                        onUpdateCell={handleUpdateCell}
                        onUpdateCoreCell={handleUpdateCoreCell}
                        onUpdateTimelineHeader={handleUpdateTimelineHeader}
                        activeCell={activeCell}
                        onSelectCell={(category, rowIndex, colIndex) => setActiveCell({ category, rowIndex, colIndex })}
                        onGenerateTechImplementation={handleGenerateTechImplementation}
                    />
                </div>
                <AIPanel
                    onGenerateColumn={handleGenerateColumnRequirements}
                    onConsolidateUI={handleConsolidateUIRequirements}
                    onRefine={handleRefineCellWithAI}
                    onTranslate={handleTranslateCellWithAI}
                    onGenerateImage={handleGenerateImage}
                    onAlignColumn={handleAlignColumnWithCoreExperience}
                    suggestions={aiSuggestions}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    activeCell={activeCell}
                    activeCellContent={activeCellContent}
                    onUpdateActiveCellContent={handleUpdateActiveCellValue}
                    activeCellSketchPrompt={activeCellSketchPrompt}
                    onUpdateActiveCellSketchPrompt={(value: string) => {
                        if (activeCell?.category === RequirementCategory.STORYBOARD) {
                            handleUpdateCell(activeCell.category, activeCell.rowIndex, activeCell.colIndex, 'sketchPrompt', value);
                        }
                    }}
                    activeTimelineStepName={activeTimelineStepName}
                    activeTimelineDescription={activeTimelineDescription}
                    onUpdateActiveTimelineDescription={(value: string) => {
                        if (activeCell?.category === 'timeline') {
                            handleUpdateTimelineDescription(activeCell.colIndex, value);
                        }
                    }}
                    gameConcept={gameConcept}
                    onUpdateGameConcept={setGameConcept}
                />
            </main>
            {isSettingsOpen && (
                <SettingsModal
                    onClose={() => setIsSettingsOpen(false)}
                    apiKeys={apiKeys}
                    setApiKeys={setApiKeys}
                    selectedProvider={selectedProvider}
                    setSelectedProvider={setSelectedProvider}
                    selectedEngine={selectedEngine}
                    setSelectedEngine={setSelectedEngine}
                />
            )}
            {notification && (
                <Notification
                    message={notification}
                    onDismiss={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default App;
