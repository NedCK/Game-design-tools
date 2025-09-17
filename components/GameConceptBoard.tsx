import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// --- TYPES & CONSTANTS ---
type AnchorPoint = 'top' | 'right' | 'bottom' | 'left';
const TAG_WIDTH = 120; // Approximate width for anchor calculation
const TAG_HEIGHT = 40; // Approximate height for anchor calculation


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
    isSelected: boolean;
    isConnecting: boolean;
    isConnectionTarget: boolean;
    onClick: (e: React.MouseEvent) => void;
    onStartConnection: (itemId: string, anchor: AnchorPoint, e: React.MouseEvent) => void;
    onSetConnectionTarget?: (itemId: string | null) => void;
}> = ({ item, isSelected, isConnecting, isConnectionTarget, onClick, onStartConnection, onSetConnectionTarget }) => {

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('aigamearchitect/json', JSON.stringify({ type: 'board-item', id: item.id }));
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const TagStyles: Record<string, string> = {
        inspiration: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        asset: 'bg-green-500/20 text-green-300 border-green-500/50'
    };

    const anchorPoints: AnchorPoint[] = ['top', 'right', 'bottom', 'left'];
    
    return (
        <div
            draggable={!isConnecting}
            onDragStart={handleDragStart}
            style={{ 
                left: `${item.position.x}px`, 
                top: `${item.position.y}px`,
                width: `${TAG_WIDTH}px`,
                height: `${TAG_HEIGHT}px`
            }}
            className={`absolute px-3 py-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing border ${TagStyles[item.type]} flex items-center justify-center group transition-transform
                ${isSelected ? 'ring-2 ring-purple-500' : ''}
                ${isConnectionTarget ? 'ring-2 ring-blue-400 scale-105' : ''}
            `}
            onClick={onClick}
            data-item-id={item.id}
            onMouseEnter={() => {
                if (isConnecting && onSetConnectionTarget) {
                    onSetConnectionTarget(item.id);
                }
            }}
            onMouseLeave={() => {
                if (isConnecting && onSetConnectionTarget) {
                    onSetConnectionTarget(null);
                }
            }}
        >
            <span className="truncate text-center">{item.text}</span>
            {isSelected && item.panel === 'refinement' && anchorPoints.map(anchor => (
                <div
                    key={anchor}
                    onMouseDown={(e) => onStartConnection(item.id, anchor, e)}
                    className={`absolute w-3 h-3 bg-gray-200 rounded-full border-2 border-purple-500 cursor-crosshair hover:scale-125 transition-transform
                        ${anchor === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' : ''}
                        ${anchor === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
                        ${anchor === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2' : ''}
                        ${anchor === 'right' ? '-right-1.5 top-1/2 -translate-y-1/2' : ''}
                    `}
                />
            ))}
        </div>
    );
};

// --- HELPER FUNCTIONS ---
const getAnchorPosition = (item: ConceptBoardItem, anchor: AnchorPoint): { x: number; y: number } => {
    const { x, y } = item.position;
    switch (anchor) {
        case 'top': return { x: x + TAG_WIDTH / 2, y };
        case 'right': return { x: x + TAG_WIDTH, y: y + TAG_HEIGHT / 2 };
        case 'bottom': return { x: x + TAG_WIDTH / 2, y: y + TAG_HEIGHT };
        case 'left': return { x, y: y + TAG_HEIGHT / 2 };
    }
};

const findClosestAnchors = (itemA: ConceptBoardItem, itemB: ConceptBoardItem): { from: AnchorPoint, to: AnchorPoint } => {
    let minDistance = Infinity;
    let closestPair: { from: AnchorPoint, to: AnchorPoint } = { from: 'right', to: 'left' };
    const anchors: AnchorPoint[] = ['top', 'right', 'bottom', 'left'];

    for (const fromAnchor of anchors) {
        for (const toAnchor of anchors) {
            const posA = getAnchorPosition(itemA, fromAnchor);
            const posB = getAnchorPosition(itemB, toAnchor);
            const distance = Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestPair = { from: fromAnchor, to: toAnchor };
            }
        }
    }
    return closestPair;
};


// --- MAIN COMPONENT ---
export const GameConceptBoard: React.FC<GameConceptBoardProps> = ({ items, paths, onAddItem, onUpdateItem, onDeleteItem, onAddPath, onUpdatePath, onDeletePath }) => {
    const { t } = useLanguage();
    const inspirationPanelRef = useRef<HTMLDivElement>(null);
    const refinementPanelRef = useRef<HTMLDivElement>(null);
    const connectionTargetIdRef = useRef<string | null>(null);

    const [tempInput, setTempInput] = useState<{ x: number; y: number } | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isPanelHovered, setIsPanelHovered] = useState<'inspiration' | 'refinement' | null>(null);
    const [connectingState, setConnectingState] = useState<{ fromId: string; fromAnchor: AnchorPoint; toPosition: { x: number; y: number } } | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null);
    const [pathCreationState, setPathCreationState] = useState<{ fromId: string; toId: string } | null>(null);
    const [pathDescription, setPathDescription] = useState('');

    const inspirationItems = items.filter(item => item.panel === 'inspiration');
    const refinementItems = items.filter(item => item.panel === 'refinement');
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedItemId && !pathCreationState) {
                onDeleteItem(selectedItemId);
                setSelectedItemId(null);
            } else if (e.key === 'Escape') {
                setSelectedItemId(null);
                setConnectingState(null);
                setIsConnecting(false);
                setPathCreationState(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId, onDeleteItem, pathCreationState]);
    
    useEffect(() => {
        if (pathCreationState) {
            setPathDescription('');
        }
    }, [pathCreationState]);


    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>, panel: 'inspiration' | 'refinement') => {
        const panelRef = panel === 'inspiration' ? inspirationPanelRef : refinementPanelRef;
        if (e.target !== panelRef.current || pathCreationState) return;
        
        setSelectedItemId(null);

        if (panel === 'inspiration') {
            const rect = panelRef.current!.getBoundingClientRect();
            setTempInput({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    const handleAddInspirationTag = (text: string) => {
        if (tempInput) {
            if (text.trim()) {
                onAddItem({ text: text.trim(), position: tempInput, type: 'inspiration', panel: 'inspiration' });
            }
        }
        setTempInput(null);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handlePanelDragEnter = (panel: 'inspiration' | 'refinement') => {
        setIsPanelHovered(panel);
    };

    const handleContainerDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsPanelHovered(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetPanel: 'inspiration' | 'refinement') => {
        e.preventDefault();
        setIsPanelHovered(null);
        
        const panelRef = targetPanel === 'inspiration' ? inspirationPanelRef : refinementPanelRef;
        if (!panelRef.current) return;
        
        const data = e.dataTransfer.getData('aigamearchitect/json');
        if (!data) return;

        const rect = panelRef.current.getBoundingClientRect();
        const position = { 
            x: e.clientX - rect.left - (TAG_WIDTH / 2), 
            y: e.clientY - rect.top - (TAG_HEIGHT / 2) 
        };

        try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'asset-tag' && targetPanel === 'refinement') {
                onAddItem({ text: parsed.label, position, type: 'asset', panel: 'refinement' });
                return;
            }

            if (parsed.type === 'board-item') {
                const sourceItem = items.find(i => i.id === parsed.id);
                if (!sourceItem) return;

                const sourcePanel = sourceItem.panel;

                if (sourcePanel === 'inspiration' && targetPanel === 'refinement') {
                    onAddItem({
                        text: sourceItem.text,
                        position: position,
                        type: 'inspiration',
                        panel: 'refinement'
                    });
                } else if (sourcePanel === targetPanel) {
                    onUpdateItem({ ...sourceItem, position });
                }
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleSetConnectionTarget = useCallback((itemId: string | null) => {
        connectionTargetIdRef.current = itemId;
        setConnectionTargetId(itemId);
    }, []);

    const handleStartConnection = (fromId: string, fromAnchor: AnchorPoint, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        setIsConnecting(true);
        const panelRect = refinementPanelRef.current!.getBoundingClientRect();

        setConnectingState({
            fromId,
            fromAnchor,
            toPosition: { x: e.clientX - panelRect.left, y: e.clientY - panelRect.top }
        });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newPos = { x: moveEvent.clientX - panelRect.left, y: moveEvent.clientY - panelRect.top };
            const currentTargetId = connectionTargetIdRef.current;

            if (currentTargetId) {
                const targetItem = refinementItems.find(i => i.id === currentTargetId);
                if (targetItem) {
                    let minDistance = Infinity;
                    let closestAnchorPos = newPos;
                    const anchors: AnchorPoint[] = ['top', 'right', 'bottom', 'left'];

                    for (const anchor of anchors) {
                        const anchorPos = getAnchorPosition(targetItem, anchor);
                        const distance = Math.sqrt(Math.pow(anchorPos.x - newPos.x, 2) + Math.pow(anchorPos.y - newPos.y, 2));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestAnchorPos = anchorPos;
                        }
                    }
                    setConnectingState(prev => prev ? { ...prev, toPosition: closestAnchorPos } : null);
                    return;
                }
            }
            
            setConnectingState(prev => prev ? { ...prev, toPosition: newPos } : null);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            
            const targetItemId = connectionTargetIdRef.current;

            if (targetItemId && targetItemId !== fromId) {
                setPathCreationState({ fromId, toId: targetItemId });
            }
            
            setIsConnecting(false);
            setConnectingState(null);
            handleSetConnectionTarget(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleConfirmPathCreation = (description: string) => {
        if (pathCreationState) {
            onAddPath({
                tagIds: [pathCreationState.fromId, pathCreationState.toId],
                description: description || ''
            });
        }
        setPathCreationState(null);
    };
    
    const handleCancelPathCreation = () => {
        setPathCreationState(null);
    };

    const handleEditPathDescription = (path: ConceptPath) => {
        const newDescription = prompt(t.conceptBoard.descriptionPlaceholder, path.description);
        if (newDescription !== null && newDescription !== path.description) {
            onUpdatePath({ ...path, description: newDescription });
        }
    };
    
    const renderPaths = () => {
        const itemMap = new Map(items.map(item => [item.id, item]));

        return paths.map(path => {
            if (path.tagIds.length < 2) return null;
            const startItem = itemMap.get(path.tagIds[0]);
            const endItem = itemMap.get(path.tagIds[1]);
            if (!startItem || !endItem || startItem.panel !== 'refinement' || endItem.panel !== 'refinement') return null;

            const { from, to } = findClosestAnchors(startItem, endItem);
            const startPos = getAnchorPosition(startItem, from);
            const endPos = getAnchorPosition(endItem, to);
            
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;

            return (
                <g key={path.id} className="group">
                    <line x1={startPos.x} y1={startPos.y} x2={endPos.x} y2={endPos.y} stroke="#6d28d9" strokeWidth="2" markerEnd="url(#arrow)" />
                    <foreignObject x={midX - 75} y={midY - 25} width="150" height="50" className="overflow-visible">
                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                            <div className="bg-gray-700 p-1 rounded-md text-xs text-gray-300 border border-gray-600 shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {path.description}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-1 opacity-0 group-hover:opacity-100 pointer-events-auto">
                                    <button onClick={() => handleEditPathDescription(path)} className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-sm"><EditIcon className="w-3 h-3" /></button>
                                    <button onClick={() => onDeletePath(path.id)} className="p-1 bg-red-600 text-white rounded-full hover:bg-red-500 shadow-sm"><TrashIcon className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    </foreignObject>
                </g>
            );
        });
    };

    const renderConnectionPreview = () => {
        if (!connectingState) return null;
        const startItem = items.find(i => i.id === connectingState.fromId);
        if (!startItem) return null;

        const startPos = getAnchorPosition(startItem, connectingState.fromAnchor);
        return <line x1={startPos.x} y1={startPos.y} x2={connectingState.toPosition.x} y2={connectingState.toPosition.y} stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#preview-arrow)" />
    };

    const renderPathCreationForm = () => {
        if (!pathCreationState) return null;

        const itemMap = new Map(items.map(item => [item.id, item]));
        const startItem = itemMap.get(pathCreationState.fromId);
        const endItem = itemMap.get(pathCreationState.toId);

        if (!startItem || !endItem) return null;
        
        const { from, to } = findClosestAnchors(startItem, endItem);
        const startPos = getAnchorPosition(startItem, from);
        const endPos = getAnchorPosition(endItem, to);
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        
        return (
            <div 
                style={{ left: `${midX}px`, top: `${midY}px` }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-2 rounded-lg shadow-2xl border border-purple-500 z-50 flex flex-col gap-2"
                onClick={e => e.stopPropagation()}
            >
                <input
                    type="text"
                    autoFocus
                    value={pathDescription}
                    onChange={e => setPathDescription(e.target.value)}
                    placeholder={t.conceptBoard.descriptionPlaceholder}
                    className="bg-gray-700 border border-gray-600 rounded p-1 text-white outline-none text-sm w-48"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmPathCreation(e.currentTarget.value);
                        if (e.key === 'Escape') handleCancelPathCreation();
                    }}
                />
                <div className="flex justify-end gap-2">
                     <button onClick={handleCancelPathCreation} className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500">{t.conceptBoard.cancelPath}</button>
                     <button onClick={() => handleConfirmPathCreation(pathDescription)} className="px-2 py-1 text-xs bg-purple-600 rounded hover:bg-purple-500">{t.conceptBoard.confirmPath}</button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-inner mb-4 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-purple-300 border-b border-gray-700 pb-3">{t.conceptBoard.title}</h3>
            <div className="grid grid-cols-2 gap-4 h-[400px]" onDragLeave={handleContainerDragLeave}>
                {/* Inspiration Panel */}
                <div 
                    className={`bg-gray-900/50 p-3 rounded-lg border relative ${isPanelHovered === 'inspiration' ? 'border-purple-500 shadow-lg shadow-purple-900/50' : 'border-gray-700'}`}
                    onDragEnter={() => handlePanelDragEnter('inspiration')}
                >
                    <h4 className="font-semibold text-gray-300">{t.conceptBoard.inspirationTitle}</h4>
                    <p className="text-xs text-gray-500 mb-2">{t.conceptBoard.inspirationHelp}</p>
                    <div ref={inspirationPanelRef} className="absolute inset-0 top-12 cursor-text" onClick={(e) => handleBackgroundClick(e, 'inspiration')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'inspiration')}>
                        {inspirationItems.map(item => (
                            <DraggableTag
                                key={item.id}
                                item={item}
                                isSelected={selectedItemId === item.id}
                                isConnecting={isConnecting}
                                isConnectionTarget={false}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemId(item.id);
                                }}
                                onStartConnection={() => {}}
                            />
                        ))}
                         {tempInput && (
                            <input
                                type="text"
                                autoFocus
                                onBlur={(e) => handleAddInspirationTag(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') handleAddInspirationTag(e.currentTarget.value) }}
                                style={{ left: `${tempInput.x}px`, top: `${tempInput.y}px` }}
                                className="absolute bg-gray-700 border border-purple-500 rounded p-2 text-white outline-none"
                            />
                        )}
                    </div>
                </div>
                {/* Refinement Panel */}
                <div
                    className={`bg-gray-900/50 p-3 rounded-lg border relative overflow-hidden ${isPanelHovered === 'refinement' ? 'border-purple-500 shadow-lg shadow-purple-900/50' : 'border-gray-700'}`}
                    onDragEnter={() => handlePanelDragEnter('refinement')}
                >
                     <h4 className="font-semibold text-gray-300">{t.conceptBoard.refinementTitle}</h4>
                    <p className="text-xs text-gray-500 mb-2">{t.conceptBoard.refinementHelp}</p>
                     <div ref={refinementPanelRef} className="absolute inset-0 top-12" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'refinement')} onClick={(e) => handleBackgroundClick(e, 'refinement')}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6d28d9" />
                                </marker>
                                <marker id="preview-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                                </marker>
                            </defs>
                            {renderPaths()}
                            {renderConnectionPreview()}
                        </svg>
                        {refinementItems.map(item => (
                            <DraggableTag 
                                key={item.id} 
                                item={item}
                                isSelected={selectedItemId === item.id}
                                isConnecting={isConnecting}
                                isConnectionTarget={connectionTargetId === item.id && connectingState?.fromId !== item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemId(item.id);
                                }}
                                onStartConnection={handleStartConnection}
                                onSetConnectionTarget={handleSetConnectionTarget}
                            />
                        ))}
                        {renderPathCreationForm()}
                     </div>
                </div>
            </div>
        </div>
    );
};