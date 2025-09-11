import React from 'react';
import { ReferenceImage, AssetSection } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


interface ReferenceImagePanelProps {
    images: ReferenceImage[];
    onCharacterUploadClick: () => void;
    onSceneUploadClick: () => void;
    onUpdateLabel: (id: string, label: string) => void;
    onDelete: (id: string) => void;
}

const AssetSectionPanel: React.FC<{
    title: string;
    images: ReferenceImage[];
    onUploadClick: () => void;
    onUpdateLabel: (id: string, label: string) => void;
    onDelete: (id: string) => void;
}> = ({ title, images, onUploadClick, onUpdateLabel, onDelete }) => {
    const { t } = useLanguage();
    
    const handleLabelBlur = (e: React.FocusEvent<HTMLDivElement>, id: string) => {
        onUpdateLabel(id, e.currentTarget.innerText);
    };

    return (
        <div>
            <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <button
                    onClick={onUploadClick}
                    className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-600 hover:bg-gray-700 hover:border-purple-500 transition-colors text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={t.artAssetPanel.uploadButton}
                >
                    <UploadIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs font-semibold">{t.artAssetPanel.uploadButton}</span>
                </button>
                {images.map(image => (
                    <div key={image.id} className="relative flex-shrink-0 w-32 h-32 group">
                        <img src={image.dataUrl} alt={image.label} className="w-full h-full object-cover rounded-lg shadow-md" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col p-2 justify-end">
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleLabelBlur(e, image.id)}
                                dangerouslySetInnerHTML={{ __html: image.label }}
                                className="text-xs text-white outline-none focus:bg-white/10 rounded p-1"
                                data-placeholder="Add label..."
                            ></div>
                        </div>
                        <button
                            onClick={() => onDelete(image.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-red-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/50 hover:text-white transition-all focus:opacity-100"
                            aria-label={t.artAssetPanel.deleteLabel}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {images.length === 0 && (
                    <p className="text-sm text-gray-500 italic ml-4">{t.artAssetPanel.placeholder}</p>
                )}
            </div>
        </div>
    );
};


export const ReferenceImagePanel: React.FC<ReferenceImagePanelProps> = ({ images, onCharacterUploadClick, onSceneUploadClick, onUpdateLabel, onDelete }) => {
    const { t } = useLanguage();

    const characterImages = images.filter(img => img.section === AssetSection.CHARACTER);
    const sceneImages = images.filter(img => img.section === AssetSection.SCENE);

    const handleDragStart = (e: React.DragEvent<HTMLSpanElement>, label: string) => {
        e.dataTransfer.setData('text/plain', `#${label}`);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-inner mb-4 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-purple-300 mb-0 border-b border-gray-700 pb-3">{t.artAssetPanel.title}</h3>
            
            <AssetSectionPanel 
                title={t.artAssetPanel.characters}
                images={characterImages}
                onUploadClick={onCharacterUploadClick}
                onUpdateLabel={onUpdateLabel}
                onDelete={onDelete}
            />
            <AssetSectionPanel 
                title={t.artAssetPanel.scenes}
                images={sceneImages}
                onUploadClick={onSceneUploadClick}
                onUpdateLabel={onUpdateLabel}
                onDelete={onDelete}
            />

            {(characterImages.length > 0 || sceneImages.length > 0) && (
                 <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-gray-300 mb-3">{t.artAssetPanel.tagsTitle}</h4>
                    <div className="flex flex-col gap-3">
                        {characterImages.length > 0 && (
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm text-gray-400 w-24 flex-shrink-0">{t.artAssetPanel.characters}:</span>
                                <div className="flex flex-wrap gap-2">
                                    {characterImages.map(img => (
                                        <span key={img.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, img.label)}
                                              className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono rounded-md cursor-grab active:cursor-grabbing hover:bg-blue-500/40 transition-colors"
                                        >
                                            #{img.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {sceneImages.length > 0 && (
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm text-gray-400 w-24 flex-shrink-0">{t.artAssetPanel.scenes}:</span>
                                <div className="flex flex-wrap gap-2">
                                    {sceneImages.map(img => (
                                         <span key={img.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, img.label)}
                                              className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-mono rounded-md cursor-grab active:cursor-grabbing hover:bg-green-500/40 transition-colors"
                                        >
                                            #{img.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </div>
    );
};