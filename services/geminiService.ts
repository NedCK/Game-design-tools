


import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GameTable, CoreExperienceRow, RequirementCategory, GameEngine, RequirementCell } from '../types';
import { CATEGORY_STATIC_DETAILS } from "../constants";

// Define safety settings to be less restrictive, preventing blocks on potentially sensitive game content.
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];


export const generateColumnRequirements = async (
    apiKey: string,
    timelineStepName: string,
    timelineStepDescription: string,
    categories: Record<RequirementCategory, {name: string}>,
    engine: GameEngine
): Promise<Record<RequirementCategory, { description: string }[]>> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // Exclude UI_SYSTEM from the generation process
    const filteredCategories = Object.entries(categories)
      .filter(([key]) => key !== RequirementCategory.UI_SYSTEM && key !== RequirementCategory.STORYBOARD);

    const categoryDetailsForPrompt = filteredCategories.map(([, value]) => `- ${value.name}`).join('\n');

    const properties: Record<string, any> = {};
    filteredCategories.forEach(([catKey, value]) => {
        properties[catKey] = {
            type: Type.ARRAY,
            description: `A list of requirements for the ${value.name} category.`,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { 
                        type: Type.STRING, 
                        description: `A brief, one-sentence starting description for a single requirement, directly related to the timeline step.`
                    }
                },
            }
        };
    });
    
    const responseSchema = {
        type: Type.OBJECT,
        properties,
    };

    const prompt = `You are an expert game designer creating a detailed requirement document.
Your task is to generate a list of initial requirement descriptions for a specific step in the game's timeline. The game is being developed using the ${engine} game engine. Please tailor any technical suggestions (especially for System Logic and Interaction) to this engine.

Timeline Step Name: "${timelineStepName}"
Detailed Description of this Step: "${timelineStepDescription}"

Based on this description, generate a list of brief, one-sentence initial descriptions for any relevant categories from the following list.
Completely ignore the 'UI System' and 'Game Storyboard' categories; they will be handled separately.
You can provide multiple descriptions for a single category if necessary.
If a category is not relevant to this timeline step, omit it entirely from your JSON response.

Categories:
${categoryDetailsForPrompt}

Each description should be a clear, actionable starting point.
Return ONLY the JSON object, with no extra commentary or markdown formatting.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error calling Gemini API for column generation:", error);
        throw new Error("Failed to generate column requirements from AI. Please check your API key and prompt.");
    }
};

export const consolidateUIRequirementsForColumn = async (
    apiKey: string,
    engine: GameEngine,
    timelineStepName: string,
    columnData: Record<string, string>
): Promise<Record<RequirementCategory.UI_SYSTEM, { description: string }[]>> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const requirementsForPrompt = Object.entries(columnData).map(([categoryName, descriptions]) => 
        `### ${categoryName}\n${descriptions}`
    ).join('\n\n');

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            [RequirementCategory.UI_SYSTEM]: {
                type: Type.ARRAY,
                description: "A consolidated list of all UI-related requirements.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "A specific, actionable requirement for a UI element, screen, or flow."
                        }
                    }
                }
            }
        }
    };

    const prompt = `You are an expert game UI/UX designer. Your task is to analyze a set of detailed game requirements for a specific development phase and consolidate all UI-related tasks into a comprehensive list. The game is being developed in the ${engine} engine.

Timeline Step: "${timelineStepName}"

Here are the detailed requirements from other design categories:
${requirementsForPrompt}

Based ONLY on the requirements provided above, extract every mention of a user interface element (like buttons, menus, HUDs, icons, notifications, etc.) and generate a clear, actionable list of requirements for the "UI System" category. Each item in the list should correspond to a specific piece of UI work that needs to be done.

Return ONLY the JSON object, with no extra commentary or markdown formatting.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                safetySettings,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error calling Gemini API for UI consolidation:", error);
        throw new Error("Failed to consolidate UI requirements from AI. Please check your API key and prompt.");
    }
};


export const refineCellContent = async (
    apiKey: string,
    content: string,
    categoryName: string,
    timelineStep: string,
    engine: GameEngine
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert game designer, known for creating detailed and clear requirement documents.
Your task is to take a brief description for a specific part of a game and expand it into a more comprehensive and actionable requirement. The game is being developed in the ${engine} game engine. Ensure any technical implementation details you add are relevant to ${engine}.

Game Timeline Step: "${timelineStep}"
Requirement Category: "${categoryName}"

Brief Description:
"${content}"

Based on this, please provide a refined, more detailed description. The new description should be ready to be used in a formal game design document. Do not add any extra commentary or introductory phrases like "Here is the refined description:", just provide the refined text itself.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for cell refinement:", error);
        throw new Error("Failed to refine content from AI. Please check your API key and prompt.");
    }
};

export const generateImage = async (
    apiKey: string,
    prompt: string,
    gameConcept: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const conceptPreamble = gameConcept 
        ? `First, strictly adhere to the following overall game concept design to ensure visual consistency. Game Concept: "${gameConcept}". `
        : '';

    const finalPrompt = `${conceptPreamble}Now, create a cinematic, high-quality storyboard frame for a video game. Style: professional concept art, detailed, atmospheric. Content: ${prompt}`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for image generation:", error);
        throw new Error("Failed to generate image from AI. Please check your API key and prompt.");
    }
};

export const translateToChinese = async (
    apiKey: string,
    content: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Translate the following English text to Simplified Chinese.
Return ONLY the translated text, without any additional comments, formatting, or introductory phrases.

Text to translate:
"${content}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for translation:", error);
        throw new Error("Failed to translate content from AI. Please check your API key.");
    }
};

export const getCoreExperienceAlignmentSuggestions = async (
    apiKey: string,
    coreExperienceForStep: string,
    timelineStepName: string,
    columnData: Partial<Record<RequirementCategory, string>>,
    engine: GameEngine
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const categoryNamesForAI: Record<RequirementCategory, string> = {
        [RequirementCategory.STORY]: 'Narrative/Story',
        [RequirementCategory.ART]: 'Visual/Art',
        [RequirementCategory.INTERACTION]: 'Interaction',
        [RequirementCategory.SYSTEM]: 'System Logic',
        [RequirementCategory.AUDIO]: 'Music/Audio',
        [RequirementCategory.UI_SYSTEM]: 'UI System',
        [RequirementCategory.STORYBOARD]: 'Game Storyboard'
    };

    let requirementsToAnalyze = '';
    for (const cat in columnData) {
        const categoryKey = cat as RequirementCategory;
        const categoryName = categoryNamesForAI[categoryKey];
        const descriptions = columnData[categoryKey];
        if (descriptions) {
            if (categoryKey === RequirementCategory.STORYBOARD) {
                 requirementsToAnalyze += `\n- **${categoryName} (Scene Description/Camera Language only):** ${descriptions}`;
            } else {
                requirementsToAnalyze += `\n- **${categoryName}:** ${descriptions}`;
            }
        }
    }

    const prompt = `You are a world-class game design consultant.
Your task is to analyze the requirements for a specific game timeline step and provide optimization suggestions to ensure they align perfectly with the stated "Core Experience" for that step. The game is being developed using the ${engine} engine.

**Timeline Step:** "${timelineStepName}"
**Core Experience to achieve in this step:** "${coreExperienceForStep}"

**Current requirements for this step:**
${requirementsToAnalyze.length > 0 ? requirementsToAnalyze : "No requirements have been defined for the categories to be analyzed yet."}

Please provide specific, actionable suggestions to better align the provided requirements with the core experience for this step.
- Analyze the following categories: Narrative/Story, Visual/Art, Interaction, and Music/Audio.
- For the "Game Storyboard" category, focus your suggestions **only** on how to improve the "Scene Description / Camera Language" to better evoke the core feeling.
- Do not suggest changes to the Core Experience itself. Your goal is to align the other requirements *to* it.
- If no requirements exist for a category, suggest some initial ideas that would fit the core experience.

Format your response as a well-structured Markdown list. Start with a brief overall summary, then provide specific suggestions for each category.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for alignment suggestions:", error);
        throw new Error("Failed to get alignment suggestions from AI. Please check your API key and prompt.");
    }
};


export const generateTechImplementation = async (
    apiKey: string,
    engine: GameEngine,
    shotTime: string,
    sceneDescription: string,
    playerStatus: string
): Promise<string> => {
    if (!apiKey) throw new Error("Gemini API key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a senior game developer and technical artist specializing in the ${engine} game engine.
Your task is to provide a concise, step-by-step technical implementation plan for a specific game storyboard shot.

Here is the context for the shot:
- Game Engine: ${engine}
- Shot Time/Context: "${shotTime || 'Not specified'}"
- Scene Description & Camera Language: "${sceneDescription}"
- Player Status during this shot: "${playerStatus || 'Not specified'}"

Based on the information above, generate a clear, actionable list of technical steps required to implement this scene in ${engine}. Focus on relevant tools, systems, assets, and potential code logic. For example, if using Unity, mention specific components, shaders, or packages. If using Unreal Engine, mention Blueprints, Materials, or specific actors.

Return ONLY the technical implementation text, without any extra commentary or introductory phrases.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for tech implementation:", error);
        throw new Error("Failed to generate tech implementation from AI.");
    }
};
