import { RequirementCategory } from './types';

interface CategoryStaticDetail {
    prefix: string;
}

export const CATEGORY_STATIC_DETAILS: Record<RequirementCategory, CategoryStaticDetail> = {
    [RequirementCategory.STORY]: {
        prefix: 'STO',
    },
    [RequirementCategory.ART]: {
        prefix: 'ART',
    },
    [RequirementCategory.INTERACTION]: {
        prefix: 'INT',
    },
    [RequirementCategory.SYSTEM]: {
        prefix: 'SYS',
    },
    [RequirementCategory.AUDIO]: {
        prefix: 'AUD',
    },
    [RequirementCategory.UI_SYSTEM]: {
        prefix: 'UI',
    },
    [RequirementCategory.STORYBOARD]: {
        prefix: 'STB',
    },
};