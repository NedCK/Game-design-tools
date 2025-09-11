import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { ReferenceImagePanel } from './components/ReferenceImagePanel';
import { GameReqTable } from './components/GameReqTable';
import { AIPanel } from './components/AIPanel';
import { SettingsModal } from './components/SettingsModal';
import { Notification } from './components/Notification';
import { refineCellContent, getCoreExperienceAlignmentSuggestions, generateColumnRequirements, translateToChinese, consolidateUIRequirementsForColumn, generateImage, generateTechImplementation } from './services/geminiService';
import { exportToCSV, exportToMarkdown } from './services/exportService';
import * as dbService from './services/dbService';
import { GameTable, CoreExperienceRow, ApiKey, AIProvider, RequirementCategory, NotificationMessage, RequirementRow, GameEngine, RequirementCell, ReferenceImage, AssetSection } from './types';
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
    const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<string>('');
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.GEMINI);
    const [selectedEngine, setSelectedEngine] = useState<GameEngine>(GameEngine.UNITY);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [notification, setNotification] = useState<NotificationMessage | null>(null);
    const [activeCell, setActiveCell] = useState<{ category: RequirementCategory | 'core' | 'timeline'; rowIndex: number; colIndex: number } | null>(null);
    const projectFileInputRef = useRef<HTMLInputElement>(null);
    const characterImageInputRef = useRef<HTMLInputElement>(null);
    const sceneImageInputRef = useRef<HTMLInputElement>(null);

    const getFullStateForLocalStorage = useCallback(() => {
        return {
            timeline,
            gameTable,
            coreExperience,
            timelineDescriptions,
            gameConcept,
            selectedEngine
        };
    }, [timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, selectedEngine]);

    const loadState = async (loadedData: any) => {
        if (!loadedData) return;
        const { timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, referenceImages, selectedEngine } = loadedData;
        if (timeline) setTimeline(timeline);
        if (gameTable) setGameTable(gameTable);
        if (coreExperience) setCoreExperience(coreExperience);
        if (timelineDescriptions) setTimelineDescriptions(timelineDescriptions);
        if (gameConcept) setGameConcept(gameConcept);
        if (selectedEngine) setSelectedEngine(selectedEngine);

        if (referenceImages && Array.isArray(referenceImages)) {
            try {
                await dbService.clearImages();
                await dbService.bulkAddImages(referenceImages);
                setReferenceImages(referenceImages);
            } catch (error) {
                console.error("Failed to load reference images into DB", error);
                setNotification({ type: 'error', message: 'Failed to load reference images from project file.' });
            }
        } else if (!referenceImages) {
             await dbService.clearImages();
             setReferenceImages([]);
        }
    };

    // Load initial data from local storage or set defaults
    useEffect(() => {
        const loadNonImageData = () => {
            try {
                const savedState = localStorage.getItem('gameReqFullState');
                const savedKeys = localStorage.getItem('gameReqApiKeys');

                if (savedState) {
                    const parsedState = JSON.parse(savedState);
                     const { referenceImages: _, ...restOfState } = parsedState; // Explicitly ignore images from localStorage
                    loadState(restOfState);
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
        };

        const loadImageData = async () => {
            try {
                await dbService.initDB();
                const images = await dbService.getAllImages();
                setReferenceImages(images);
            } catch (error) {
                console.error("Failed to load images from DB", error);
                setNotification({ type: 'error', message: 'Failed to load reference images.' });
            }
        };

        loadNonImageData();
        loadImageData();
    }, [t]);

    // Save to local storage
    const saveStateToLocalStorage = useCallback(() => {
        try {
            const stateToSave = getFullStateForLocalStorage();
            localStorage.setItem('gameReqFullState', JSON.stringify(stateToSave));
            localStorage.setItem('gameReqApiKeys', JSON.stringify(apiKeys));
        } catch (error) {
            console.error("Failed to save state", error);
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                 setNotification({ type: 'error', message: "Local storage quota exceeded. This can happen with very large projects." });
            } else {
                 setNotification({ type: 'error', message: t.notifications.saveFailed });
            }
        }
    }, [getFullStateForLocalStorage, apiKeys, t.notifications.saveFailed]);

    // Debounced save effect
    useEffect(() => {
        const handler = setTimeout(() => {
            saveStateToLocalStorage();
        }, 2000);
        return () => clearTimeout(handler);
    }, [timeline, gameTable, coreExperience, timelineDescriptions, gameConcept, selectedEngine, apiKeys, saveStateToLocalStorage]);

    const handleSaveToFile = async () => {
        try {
            const nonImageState = getFullStateForLocalStorage();
            const imagesFromDb = await dbService.getAllImages();
            const fullState = { ...nonImageState, referenceImages: imagesFromDb };

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
        projectFileInputRef.current?.click();
    };

    const handleProjectFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const parsedState = JSON.parse(text);
                    await loadState(parsedState);
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
    
    const handleReferenceImageUploadClick = (section: AssetSection) => {
        if (section === AssetSection.CHARACTER) {
            characterImageInputRef.current?.click();
        } else {
            sceneImageInputRef.current?.click();
        }
    };
    
    const handleReferenceImageSelected = (event: React.ChangeEvent<HTMLInputElement>, section: AssetSection) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            if (typeof e.target?.result === 'string') {
                const newImage: ReferenceImage = {
                    id: crypto.randomUUID(),
                    dataUrl: e.target.result,
                    label: file.name.split('.')[0] || 'New Asset',
                    section: section,
                };
                try {
                    await dbService.addImage(newImage);
                    setReferenceImages(prev => [...prev, newImage]);
                } catch (error) {
                    console.error("Failed to save new image to DB", error);
                    setNotification({ type: 'error', message: 'Failed to save reference image.' });
                }
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleUpdateReferenceImageLabel = async (id: string, label: string) => {
        const imageToUpdate = referenceImages.find(img => img.id === id);
        if (imageToUpdate) {
            const updatedImage = { ...imageToUpdate, label };
             try {
                await dbService.updateImage(updatedImage);
                setReferenceImages(prev => prev.map(img => img.id === id ? updatedImage : img));
            } catch (error) {
                console.error("Failed to update image label in DB", error);
                setNotification({ type: 'error', message: 'Failed to update image label.' });
            }
        }
    };

    const handleDeleteReferenceImage = async (id: string) => {
        try {
            await dbService.deleteImage(id);
            setReferenceImages(prev => prev.filter(img => img.id !== id));
        } catch (error) {
            console.error("Failed to delete image from DB", error);
            setNotification({ type: 'error', message: 'Failed to delete reference image.' });
        }
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

    const handleDeleteTimelineStep = (colIndex: number) => {
        if (!window.confirm(t.notifications.confirmDeleteStep.replace('{stepName}', timeline[colIndex]))) {
            return;
        }
    
        setTimeline(prev => prev.filter((_, i) => i !== colIndex));
        setTimelineDescriptions(prev => prev.filter((_, i) => i !== colIndex));
    
        const removeAndReIndex = <T extends Record<number, any>>(obj: T): T => {
            const newObj: Record<number, any> = {};
            let newIndex = 0;
            const sortedKeys = Object.keys(obj).map(Number).sort((a, b) => a - b);
            for (const oldIndex of sortedKeys) {
                if (oldIndex !== colIndex) {
                    newObj[newIndex] = obj[oldIndex];
                    newIndex++;
                }
            }
            return newObj as T;
        };
        
        setGameTable(prev => {
            const newTable = { ...prev };
            Object.keys(newTable).forEach(catKey => {
                const cat = catKey as RequirementCategory;
                newTable[cat] = (newTable[cat] || []).map(row => removeAndReIndex(row));
            });
            return newTable;
        });
    
        setCoreExperience(prev => removeAndReIndex(prev));
    
        if (activeCell?.colIndex === colIndex) {
            setActiveCell(null);
        } else if (activeCell && activeCell.colIndex > colIndex) {
            setActiveCell(prev => prev ? { ...prev, colIndex: prev.colIndex - 1 } : null);
        }
        
        setNotification({ type: 'success', message: t.notifications.stepDeleted });
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
            
            const result = await generateColumnRequirements(apiKey, gameConcept, timelineStepName, timelineDescription, t.categories as Record<RequirementCategory, {name: string}>, selectedEngine);
            
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
            const resultUrl = await generateImage(apiKey, prompt, gameConcept, referenceImages);
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
                ref={projectFileInputRef}
                onChange={handleProjectFileSelected}
                accept=".json,application/json"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={characterImageInputRef}
                onChange={(e) => handleReferenceImageSelected(e, AssetSection.CHARACTER)}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
            />
             <input
                type="file"
                ref={sceneImageInputRef}
                onChange={(e) => handleReferenceImageSelected(e, AssetSection.SCENE)}
                accept="image/png, image/jpeg, image/webp"
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
                    <ReferenceImagePanel 
                        images={referenceImages}
                        onCharacterUploadClick={() => handleReferenceImageUploadClick(AssetSection.CHARACTER)}
                        onSceneUploadClick={() => handleReferenceImageUploadClick(AssetSection.SCENE)}
                        onUpdateLabel={handleUpdateReferenceImageLabel}
                        onDelete={handleDeleteReferenceImage}
                    />
                    <GameReqTable 
                        timeline={timeline}
                        gameTable={gameTable}
                        coreExperience={coreExperience}
                        onUpdateCell={handleUpdateCell}
                        onUpdateCoreCell={handleUpdateCoreCell}
                        onUpdateTimelineHeader={handleUpdateTimelineHeader}
                        onDeleteTimelineStep={handleDeleteTimelineStep}
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