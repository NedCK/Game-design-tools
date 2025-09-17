import React, { useState, useRef, useEffect } from 'react';
import { ConceptBoardItem, ConceptPath } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// --- ICONS ---
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

// --- COMPONENT PROPS ---
interface GameConceptBoardProps {
    items: ConceptBoardItem[];
    paths: ConceptPath[];
    onAddItem: (item: Omit<ConceptBoardItem, 'id'>) => void;
    onUpdateItem: (item: ConceptBoardItem) => void;
    onDeleteItem: (id: string) => void;
    onAddPath: (path: Omit<ConceptPath, 'id'>) => void;
    onUpdatePath: (path: ConceptPath) => void;
    onDeletePath: (id: string) => void;
}

// --- DRAGGABLE TAG COMPONENT ---
const DraggableTag: React.FC<{
    item: ConceptBoardItem;
    isConnectingFrom: boolean;
    onStartConnection: (id: string) => void;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    showConnectionDot: boolean;
}> = ({ item, isConnectingFrom, onStartConnection, isSelected, onClick, showConnectionDot }) => {

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Use a generic 'board-item' type for any item being dragged from within the board.
        e.dataTransfer.setData('aigamearchitect/json', JSON.stringify({ type: 'board-item', id: item.id }));
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const TagStyles: Record<string, string> = {
        inspiration: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        asset: 'bg-green-500/20 text-green-300 border-green-500/50'
    };
    
    return (
        <div
            draggable
            onDragStart={handleDragStart}
            style={{ left: `${item.position.x}px`, top: `${item.position.y}px` }}
            className={`absolute px-3 py-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing border ${TagStyles[item.type]} flex items-center gap-2 transition-transform duration-100 ease-in-out group ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
            onClick={onClick}
        >
            <span>{item.text}</span>
            {showConnectionDot && (
                <div 
                    className={`w-3 h-3 rounded-full bg-gray-400 group-hover:bg-purple-400 cursor-pointer transition-colors ${isConnectingFrom ? 'ring-2 ring-purple-400' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStartConnection(item.id);
                    }}
                />
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
export const GameConceptBoard: React.FC<GameConceptBoardProps> = ({ items, paths, onAddItem, onUpdateItem, onDeleteItem, onAddPath, onUpdatePath, onDeletePath }) => {
    const { t } = useLanguage();
    const inspirationPanelRef = useRef<HTMLDivElement>(null);
    const refinementPanelRef = useRef<HTMLDivElement>(null);

    const [tempInput, setTempInput] = useState<{ x: number; y: number } | null>(null);
    const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
    const [newPathTags, setNewPathTags] = useState<string[]>([]);
    const [editingPath, setEditingPath] = useState<{id: string, description: string} | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Effect for handling delete key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedItemId) {
                const itemToDelete = items.find(item => item.id === selectedItemId);
                // Only allow deleting tags in the inspiration panel
                if (itemToDelete && itemToDelete.panel === 'inspiration') {
                    onDeleteItem(selectedItemId);
                    setSelectedItemId(null); // Deselect after deletion
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedItemId, items, onDeleteItem]);


    const inspirationItems = items.filter(item => item.panel === 'inspiration');
    const refinementItems = items.filter(item => item.panel === 'refinement');

    const handleInspirationClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== inspirationPanelRef.current) return;
        if (!inspirationPanelRef.current) return;
        const rect = inspirationPanelRef.current.getBoundingClientRect();
        setTempInput({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setSelectedItemId(null); // Deselect any item when clicking the background
    };

    const handleAddInspirationTag = (text: string) => {
        if (!text.trim() || !tempInput) return;
        onAddItem({ text: text.trim(), position: tempInput, type: 'inspiration', panel: 'inspiration' });
        setTempInput(null);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        // By not setting dropEffect, we let the browser use the value
        // from effectAllowed set in onDragStart. Forcing a single value
        // like 'copy' created a conflict when dragging items with
        // effectAllowed set to 'move', preventing them from being dropped.
    };

    const handleDrop = (e: React.DragEvent, panel: 'inspiration' | 'refinement') => {
        e.preventDefault();
        const panelRef = panel === 'inspiration' ? inspirationPanelRef : refinementPanelRef;
        if (!panelRef.current) return;
        
        const data = e.dataTransfer.getData('aigamearchitect/json');
        if (!data) return;

        const rect = panelRef.current.getBoundingClientRect();
        const position = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'board-item') {
                const originalItem = items.find(i => i.id === parsed.id);
                if (originalItem) {
                    // If dragging from inspiration to refinement, COPY it.
                    if (originalItem.panel === 'inspiration' && panel === 'refinement') {
                        onAddItem({
                            text: originalItem.text,
                            position,
                            type: 'inspiration',
                            panel: 'refinement'
                        });
                    } else {
                        // Otherwise (e.g., within the same panel), MOVE it.
                        onUpdateItem({ ...originalItem, position, panel });
                    }
                }
            } else if (parsed.type === 'asset-tag' && panel === 'refinement') {
                onAddItem({ text: parsed.label, position, type: 'asset', panel: 'refinement' });
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleStartConnection = (id: string) => {
        setConnectingFromId(id);
        if (!newPathTags.includes(id)) {
            setNewPathTags(prev => [...prev, id]);
        }
    };
    
    const handleEndConnection = (id: string) => {
        if (connectingFromId && connectingFromId !== id && !newPathTags.includes(id)) {
            setNewPathTags(prev => [...prev, id]);
            setConnectingFromId(id);
        }
    };

    const handleSavePath = () => {
        const description = prompt(t.conceptBoard.descriptionPlaceholder);
        if (description !== null && newPathTags.length >= 2) {
            onAddPath({ tagIds: newPathTags, description });
        }
        setNewPathTags([]);
        setConnectingFromId(null);
    };

    const handleCancelPath = () => {
        setNewPathTags([]);
        setConnectingFromId(null);
    };

    const handleEditPathDescription = (path: ConceptPath) => {
        const newDescription = prompt(t.conceptBoard.descriptionPlaceholder, path.description);
        if (newDescription !== null && newDescription !== path.description) {
            onUpdatePath({ ...path, description: newDescription });
        }
    };
    
    const getItemPosition = (id: string) => items.find(item => item.id === id)?.position;

    const renderPaths = (pathList: ConceptPath[], isPreview: boolean = false) => {
        const itemMap = new Map(items.map(item => [item.id, item]));

        return pathList.map((path, pIndex) => (
            <g key={isPreview ? `preview-${pIndex}` : path.id}>
                {path.tagIds.slice(0, -1).map((tagId, index) => {
                    const nextTagId = path.tagIds[index + 1];
                    const startItem = itemMap.get(tagId);
                    const endItem = itemMap.get(nextTagId);
                    if (!startItem || !endItem) return null;

                    return <line key={`${tagId}-${nextTagId}`} x1={startItem.position.x + 50} y1={startItem.position.y + 20} x2={endItem.position.x + 50} y2={endItem.position.y + 20} stroke={isPreview ? "#a855f7" : "#6d28d9"} strokeWidth="2" markerEnd="url(#arrow)" />;
                })}
            </g>
        ));
    };


    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-inner mb-4 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-purple-300 border-b border-gray-700 pb-3">{t.conceptBoard.title}</h3>
            <div className="grid grid-cols-2 gap-4 h-[400px]">
                {/* Inspiration Panel */}
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 relative" >
                    <h4 className="font-semibold text-gray-300">{t.conceptBoard.inspirationTitle}</h4>
                    <p className="text-xs text-gray-500 mb-2">{t.conceptBoard.inspirationHelp}</p>
                    <div ref={inspirationPanelRef} className="absolute inset-0 top-12" onClick={handleInspirationClick} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'inspiration')}>
                        {inspirationItems.map(item => (
                            <DraggableTag
                                key={item.id}
                                item={item}
                                isConnectingFrom={false}
                                onStartConnection={() => {}}
                                isSelected={selectedItemId === item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemId(item.id);
                                }}
                                showConnectionDot={false}
                            />
                        ))}
                         {tempInput && (
                            <input
                                type="text"
                                autoFocus
                                onBlur={(e) => handleAddInspirationTag(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddInspirationTag(e.currentTarget.value) }}
                                style={{ left: `${tempInput.x}px`, top: `${tempInput.y}px` }}
                                className="absolute bg-gray-700 border border-purple-500 rounded p-2 text-white outline-none"
                            />
                        )}
                    </div>
                </div>
                {/* Refinement Panel */}
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 relative">
                     <h4 className="font-semibold text-gray-300">{t.conceptBoard.refinementTitle}</h4>
                    <p className="text-xs text-gray-500 mb-2">{t.conceptBoard.refinementHelp}</p>
                     <div ref={refinementPanelRef} className="absolute inset-0 top-12" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'refinement')}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6d28d9" />
                                </marker>
                            </defs>
                            {renderPaths(paths)}
                            {newPathTags.length > 1 && renderPaths([{ id: 'preview', tagIds: newPathTags, description: '' }], true)}
                        </svg>
                        {refinementItems.map(item => (
                            <DraggableTag 
                                key={item.id} 
                                item={item}
                                isConnectingFrom={connectingFromId === item.id}
                                onStartConnection={handleStartConnection}
                                isSelected={false} // Refinement tags are not selectable for deletion
                                onClick={() => {
                                    if (connectingFromId) {
                                        handleEndConnection(item.id);
                                    }
                                }}
                                showConnectionDot={true}
                            />
                        ))}
                        {paths.map(path => {
                            const lastTagId = path.tagIds[path.tagIds.length - 1];
                            const lastTagPos = getItemPosition(lastTagId);
                            if(!lastTagPos) return null;
                            return (
                                <div key={path.id} className="absolute group" style={{ left: `${lastTagPos.x}px`, top: `${lastTagPos.y + 40}px`, maxWidth: '200px' }}>
                                    <div className="bg-gray-700 p-2 rounded-md text-xs text-gray-300 border border-gray-600 shadow-lg">
                                        {path.description}
                                    </div>
                                    <div className="absolute top-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity -mt-3 -mr-3">
                                        <button onClick={() => handleEditPathDescription(path)} className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-sm"><EditIcon className="w-3 h-3" /></button>
                                        <button onClick={() => onDeletePath(path.id)} className="p-1 bg-red-600 text-white rounded-full hover:bg-red-500 shadow-sm ml-1"><TrashIcon className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            )
                        })}
                     </div>
                     {newPathTags.length >= 2 && (
                        <div className="absolute bottom-2 right-2 flex gap-2">
                             <button onClick={handleSavePath} className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded-md">{t.conceptBoard.confirmPath}</button>
                             <button onClick={handleCancelPath} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md">{t.conceptBoard.cancelPath}</button>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};