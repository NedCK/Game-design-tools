export enum RequirementCategory {
  STORY = 'STORY',
  ART = 'ART',
  INTERACTION = 'INTERACTION',
  SYSTEM = 'SYSTEM',
  AUDIO = 'AUDIO',
  UI_SYSTEM = 'UI_SYSTEM',
  STORYBOARD = 'STORYBOARD',
}

export interface RequirementCell {
  id: string; // Used as Storyboard ID for STORYBOARD category
  description: string; // Used as Scene Description for STORYBOARD category
  imageUrl?: string; // Used as Sketch Image URL for STORYBOARD category

  // --- New fields for Storyboard ---
  shotTime?: string;
  playerStatus?: string;
  techImplementation?: string;
  sketchPrompt?: string;
}


export type RequirementRow = Record<number, RequirementCell>;

// Changed: Each category can now have multiple rows.
export type GameTable = Record<RequirementCategory, RequirementRow[]>;

export interface CoreExperienceCell {
  description: string;
}

export type CoreExperienceRow = Record<number, CoreExperienceCell>;

export enum AIProvider {
    GEMINI = 'Google Gemini',
    OPENAI = 'OpenAI (GPT)',
    ANTHROPIC = 'Anthropic (Claude)',
    LOCAL = 'Local API (Ollama, etc.)'
}

export enum GameEngine {
  UNITY = 'Unity',
  UE = 'Unreal Engine',
  GODOT = 'Godot'
}

export interface ApiKey {
    provider: AIProvider;
    key: string;
}

export interface NotificationMessage {
    type: 'success' | 'error' | 'info';
    message: string;
}

export enum AssetSection {
  CHARACTER = 'CHARACTER',
  SCENE = 'SCENE',
}

export interface ReferenceImage {
  id: string;
  dataUrl: string;
  label: string;
  section: AssetSection;
}

export interface ArtConceptSegment {
  id: string;
  title: string; // S1, S2, ...
  timelineRange: string; // User input like "2-4"
  description: string;
}
