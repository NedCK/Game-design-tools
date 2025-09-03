


import { GameTable, CoreExperienceRow, RequirementCategory } from '../types';
import { translations } from '../localization/translations';

const escapeCSV = (str: string): string => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportToCSV = (timeline: string[], gameTable: GameTable, coreExperience: CoreExperienceRow, t: typeof translations.en): void => {
    const BOM = '\uFEFF';
    const rows = [];

    const headers = [t.table.category, ...timeline.map(escapeCSV)];
    rows.push(headers.join(','));

    Object.values(RequirementCategory).forEach(cat => {
        const catRows = gameTable[cat] || [];
        catRows.forEach((row, rowIndex) => {
            const rowData = [rowIndex === 0 ? t.categories[cat].name : ''];
            timeline.forEach((_, index) => {
                const cell = row[index];
                let cellText = '';
                if (cell && cell.id) {
                    if (cat === RequirementCategory.STORYBOARD) {
                        const sb = t.table.storyboard;
                        cellText = [
                            `${sb.id}: ${cell.id}`,
                            `${sb.shotTime}: ${cell.shotTime || ''}`,
                            `${sb.sceneDescription}: ${cell.description || ''}`,
                            `${sb.playerStatus}: ${cell.playerStatus || ''}`,
                            `${sb.techImplementation}: ${cell.techImplementation || ''}`,
                            `${sb.sketch} Prompt: ${cell.sketchPrompt || ''}`,
                        ].join('\n');
                    } else {
                        cellText = `${cell.id}: ${cell.description}`;
                    }
                }
                rowData.push(escapeCSV(cellText));
            });
            rows.push(rowData.join(','));
        });
    });

    const coreRow = [t.table.coreExperience];
    timeline.forEach((_, index) => {
        coreRow.push(escapeCSV(coreExperience[index]?.description || ''));
    });
    rows.push(coreRow.join(','));
    
    const csvString = rows.join('\r\n');

    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'game_requirements.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const escapeMarkdown = (str: string): string => {
    return str.replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
};

export const exportToMarkdown = (timeline: string[], gameTable: GameTable, coreExperience: CoreExperienceRow, t: typeof translations.en): void => {
    let mdContent = `# Game Requirements Document\n\n`;

    const headers = [t.table.category, ...timeline.map(escapeMarkdown)];
    mdContent += `| ${headers.join(' | ')} |\n`;
    mdContent += `| ${headers.map(() => '---').join(' | ')} |\n`;

    Object.values(RequirementCategory).forEach(cat => {
        const catRows = gameTable[cat] || [];
        catRows.forEach((row, rowIndex) => {
            const rowData = [rowIndex === 0 ? `**${t.categories[cat].name}**` : ''];
            timeline.forEach((_, index) => {
                const cell = row[index];
                let cellText = '';
                if (cell && cell.id) {
                    if (cat === RequirementCategory.STORYBOARD) {
                        const sb = t.table.storyboard;
                        const parts = [
                            `**${sb.id}:** ${escapeMarkdown(cell.id)}`,
                            `**${sb.shotTime}:** ${escapeMarkdown(cell.shotTime || '')}`,
                            `**${sb.sceneDescription}:** ${escapeMarkdown(cell.description || '')}`,
                            `**${sb.playerStatus}:** ${escapeMarkdown(cell.playerStatus || '')}`,
                            `**${sb.techImplementation}:** ${escapeMarkdown(cell.techImplementation || '')}`,
                            `**${sb.sketch} Prompt:** ${escapeMarkdown(cell.sketchPrompt || '')}`
                        ];
                        if (cell.imageUrl) {
                            parts.push(`**${sb.sketch}:**<br/><img src="${cell.imageUrl}" alt="${escapeMarkdown(cell.sketchPrompt || 'storyboard image')}" width="200"/>`);
                        }
                        cellText = parts.join('<br/>');
                    } else {
                        cellText = `*${cell.id}*<br/>${escapeMarkdown(cell.description)}`;
                    }
                }
                rowData.push(cellText);
            });
            mdContent += `| ${rowData.join(' | ')} |\n`;
        });
    });
    
    const coreRow = [`**${t.table.coreExperience}**`];
    timeline.forEach((_, index) => {
        coreRow.push(escapeMarkdown(coreExperience[index]?.description || ''));
    });
    mdContent += `| ${coreRow.join(' | ')} |\n`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'game_requirements.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};