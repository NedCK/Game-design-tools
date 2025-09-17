import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ApiKey, AIProvider, GameEngine } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
    onClose: () => void;
    apiKeys: ApiKey[];
    setApiKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
    selectedProvider: AIProvider;
    setSelectedProvider: React.Dispatch<React.SetStateAction<AIProvider>>;
    selectedEngine: GameEngine;
    setSelectedEngine: React.Dispatch<React.SetStateAction<GameEngine>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, apiKeys, setApiKeys, selectedProvider, setSelectedProvider, selectedEngine, setSelectedEngine
}) => {
    const { t } = useLanguage();
    const [currentKey, setCurrentKey] = useState('');
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const keyForProvider = apiKeys.find(k => k.provider === selectedProvider)?.key || '';
        setCurrentKey(keyForProvider);
    }, [selectedProvider, apiKeys]);

    const handleSave = () => {
        const otherKeys = apiKeys.filter(k => k.provider !== selectedProvider);
        const newKeys: ApiKey[] = [...otherKeys];
        if (currentKey) {
            newKeys.push({ provider: selectedProvider, key: currentKey });
        }
        setApiKeys(newKeys);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">{t.settings.title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    <div>
                        <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-300 mb-1">
                            {t.settings.provider}
                        </label>
                        <select
                            id="ai-provider"
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                        >
                            {Object.values(AIProvider).map(provider => (
                                <option key={provider} value={provider}>{provider}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">
                            {t.settings.apiKeyFor.replace('{provider}', selectedProvider)}
                        </label>
                        <input
                            id="api-key"
                            type="password"
                            value={currentKey}
                            onChange={(e) => setCurrentKey(e.target.value)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                            placeholder={t.settings.apiKeyPlaceholder}
                        />
                        <p className="text-xs text-gray-500 mt-1">{t.settings.helpText}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t.settings.gameEngine}
                        </label>
                        <div className="grid grid-cols-3 gap-2 rounded-md bg-gray-900 p-1">
                            {Object.values(GameEngine).map(engine => (
                                <button
                                    key={engine}
                                    onClick={() => setSelectedEngine(engine)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                        selectedEngine === engine ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {engine}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6">
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="text-purple-400 hover:text-purple-300 font-semibold mb-4 text-left w-full"
                        >
                            {showGuide ? `▾ ${t.settings.hideUserGuide}` : `▸ ${t.settings.viewUserGuide}`}
                        </button>
                        {showGuide && (
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4">
                                <h3 className="text-lg font-bold text-purple-300 !mb-2">{t.settings.userGuide.title}</h3>
                                {/* FIX: Replaced unsupported `className` prop by wrapping ReactMarkdown in a div with the class. */}
                                <div className="!mt-0"><ReactMarkdown>{t.settings.userGuide.intro.content}</ReactMarkdown></div>
                                
                                <h4 className="font-semibold text-gray-100">{t.settings.userGuide.gettingStarted.title}</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    {/* FIX: Replaced `React.Fragment` with a type-safe functional component to unwrap paragraphs. */}
                                    <li><ReactMarkdown components={{p: (props) => <>{props.children}</>}}>{t.settings.userGuide.gettingStarted.apiKey}</ReactMarkdown></li>
                                    <li><ReactMarkdown components={{p: (props) => <>{props.children}</>}}>{t.settings.userGuide.gettingStarted.addStep}</ReactMarkdown></li>
                                    <li><ReactMarkdown components={{p: (props) => <>{props.children}</>}}>{t.settings.userGuide.gettingStarted.editCells}</ReactMarkdown></li>
                                </ul>

                                <h4 className="font-semibold text-gray-100">{t.settings.userGuide.coreFeatures.title}</h4>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.generateColumn}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.refineCell}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.consolidateUI}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.conceptBoard}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.generateStoryboard}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.coreFeatures.alignExperience}</ReactMarkdown></li>
                                </ul>

                                <h4 className="font-semibold text-gray-100">{t.settings.userGuide.projectManagement.title}</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><ReactMarkdown>{t.settings.userGuide.projectManagement.saveLoad}</ReactMarkdown></li>
                                    <li><ReactMarkdown>{t.settings.userGuide.projectManagement.export}</ReactMarkdown></li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex-shrink-0 flex justify-end gap-3 bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        {t.settings.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                        {t.settings.save}
                    </button>
                </div>
            </div>
        </div>
    );
};