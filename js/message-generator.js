/**
 * PurposeMobile Field Tools - Message Generator
 * Generates unified, standardized field reports from all tools
 * 
 * CRITICAL: This follows the PurposeMobile Text Message Format Standard
 * DO NOT modify format without explicit user approval
 */

import { appState } from './state.js';
import { formatRatio } from './ui.js';

/**
 * Generate complete unified message from all tools
 * Format follows strict standard - see documentation
 */
export function updateUnifiedPreview() {
    if (appState.manualPreviewEdit) return;
    
    const projectName = document.getElementById('unifiedProjectName').value.trim();
    const stage = document.getElementById('unifiedStage').value.trim();
    
    let message = '';
    
    // Project Header
    if (projectName && stage) {
        message += `${projectName} ${stage}\n\n`;
    }
    
    // PIPE LEVEL CHECK SECTION - FIRST as per standard
    message += generatePipeLevelCheckSection();
    
    // LASER CONVERSIONS SECTION
    message += generateLaserSection();
    
    // REGRADE CALCULATIONS SECTION
    message += generateRegradeSection();
    
    // GRADE CHECK SECTION
    message += generateGradeCheckSection();
    
    // CHAINAGE IL SECTION
    message += generateChainageILSection();
    
    // GENERAL NOTES SECTION - AT THE BOTTOM as per standard
    message += generateGeneralNotesSection();
    
    // Update preview textarea
    const previewTextarea = document.getElementById('unifiedPreviewText');
    previewTextarea.value = message || 
        'Enter project information and add calculations to generate field report...';
    
    const warningElement = document.getElementById('unifiedFormatWarning');
    if (warningElement) {
        warningElement.classList.add('hidden');
    }
}

/**
 * Generate Pipe Level Check section
 */
function generatePipeLevelCheckSection() {
    const readings = appState.pipeLevelCheck.readings.filter(r => r.calculated);
    if (readings.length === 0) return '';
    
    let section = `PIPE LEVEL CHECKS\n\n`;
    
    readings.forEach((reading, index) => {
        if (reading.sectionId) {
            section += `${reading.sectionId}\n\n`;
        }
        
        const distance = parseFloat(reading.distance);
        const measuredHeight = parseFloat(reading.measuredHeight);
        const designHeight = parseFloat(reading.results.designHeight);
        const difference = parseFloat(reading.results.difference);
        const status = reading.results.status.split(' ')[0].toUpperCase();
        
        section += `CH - ${distance.toFixed(2)}\n`;
        section += `DES - ${designHeight.toFixed(3)}\n`;
        section += `AS CON - ${measuredHeight.toFixed(3)}\n`;
        section += `${status} - ${Math.abs(difference).toFixed(3)}\n\n`;
        
        if (reading.notes) {
            section += `- ${reading.notes}\n\n`;
        }
        
        if (index < readings.length - 1) {
            section += '\n';
        }
    });
    
    section += '\n';
    return section;
}

/**
 * Generate Laser Conversions section
 */
function generateLaserSection() {
    const readings = appState.laser.readings.filter(r => r.gradeRatio || r.laserPercent);
    if (readings.length === 0) return '';
    
    let section = `LASER GRADE CONVERSIONS\n\n`;
    
    readings.forEach((reading, index) => {
        if (reading.sectionId) {
            section += `${reading.sectionId}\n\n`;
        }
        
        const ratio = reading.gradeRatio || (100 / reading.laserPercent);
        const percent = reading.laserPercent || (100 / reading.gradeRatio);
        const ratioDisplay = formatRatio(ratio);
        
        section += `GRADE - 1 in ${ratioDisplay}\n`;
        section += `LASER - ${percent.toFixed(4)}%\n`;
        
        if (reading.notes) {
            section += `\n- ${reading.notes}\n`;
        }
        
        if (index < readings.length - 1) {
            section += '\n';
        }
    });
    
    section += '\n';
    return section;
}

/**
 * Generate Regrade Calculations section
 */
function generateRegradeSection() {
    const readings = appState.regrade.readings.filter(r => r.calculated && r.results);
    if (readings.length === 0) return '';
    
    let section = `REGRADE CALCULATIONS\n\n`;
    
    readings.forEach((reading, index) => {
        if (reading.sectionId) {
            section += `${reading.sectionId}\n\n`;
        }
        
        const currentGradeValue = reading.gradeMode === 'percent' ? 
            parseFloat(reading.currentGrade) : 
            parseFloat(reading.currentRatio);
        const currentGradePercent = reading.gradeMode === 'percent' ? 
            currentGradeValue : 
            100 / currentGradeValue;
        const currentGradeRatio = reading.gradeMode === 'percent' ? 
            100 / currentGradeValue : 
            currentGradeValue;
        
        const newGradePercent = parseFloat(reading.results.newGradePercent);
        const newGradeRatio = parseFloat(reading.results.newGradeRatio);
        
        section += `REGRADE\n\n`;
        section += `FROM - ${currentGradePercent.toFixed(3)}% (1 in ${formatRatio(currentGradeRatio)})\n`;
        section += `TO - ${newGradePercent.toFixed(3)}% (1 in ${formatRatio(newGradeRatio)})\n\n`;
        
        const currentHeight = parseFloat(reading.currentHeight);
        const targetHeight = parseFloat(reading.targetHeight);
        const distance = parseFloat(reading.distance);
        
        section += `AS CON IL - ${currentHeight.toFixed(3)}\n`;
        section += `TARGET IL - ${targetHeight.toFixed(3)}\n`;
        section += `DISTANCE - ${distance.toFixed(3)}\n\n`;
        
        if (reading.chainage) {
            const chainage = parseFloat(reading.chainage);
            if (!isNaN(chainage)) {
                section += `CHAINAGE - ${chainage.toFixed(2)}\n\n`;
            }
        }
        
        if (reading.notes) {
            const noteLines = reading.notes.split('\n').filter(line => line.trim());
            noteLines.forEach(line => {
                section += `- ${line.trim()}\n\n`;
            });
        }
        
        if (index < readings.length - 1) {
            section += '\n';
        }
    });
    
    section += '\n';
    return section;
}

/**
 * Generate Grade Check section
 */
function generateGradeCheckSection() {
    const readings = appState.gradeCheck.readings.filter(r => r.status !== null);
    if (readings.length === 0) return '';
    
    let section = `GRADE VERIFICATIONS\n\n`;
    
    readings.forEach((reading, index) => {
        if (reading.sectionId) {
            section += `${reading.sectionId}\n\n`;
        }
        
        const designGradePercent = reading.gradeMode === 'percent' ? 
            reading.designGrade : 
            100 / reading.designGrade;
        
        section += `DISTANCE - ${reading.length.toFixed(2)}\n\n`;
        
        section += `DES GRADE - ${designGradePercent.toFixed(3)}%\n`;
        section += `DES RISE/FALL - ${reading.designRise.toFixed(3)}\n`;
        section += `DES RISE/FALL PER METER - ${reading.designRisePerMeter.toFixed(3)}mm\n\n`;
        
        section += `AS CON GRADE - ${reading.actualGrade.toFixed(3)}%\n`;
        section += `AS CON RISE/FALL - ${reading.actualRise.toFixed(3)}\n`;
        section += `AS CON RISE/FALL PER METER - ${reading.actualRisePerMeter.toFixed(3)}mm\n\n`;
        
        section += `PERCENTAGE DIFFERENCE - ${reading.percentageDifference.toFixed(3)}%\n`;
        section += `RISE/FALL DIFFERENCE - ${reading.riseFallDifference.toFixed(3)}\n\n`;
        
        if (reading.notes) {
            const noteLines = reading.notes.split('\n').filter(line => line.trim());
            noteLines.forEach(line => {
                section += `- ${line.trim()}\n\n`;
            });
        }
        
        if (index < readings.length - 1) {
            section += '\n';
        }
    });
    
    section += '\n';
    return section;
}

/**
 * Generate Chainage IL section
 */
function generateChainageILSection() {
    const readings = appState.chainageIL.readings.filter(r => r.calculated);
    if (readings.length === 0) return '';
    
    let section = `IL AT CHAINAGE\n\n`;
    
    readings.forEach((reading, index) => {
        if (reading.sectionId) {
            section += `${reading.sectionId}\n\n`;
        }
        
        const startIL = parseFloat(reading.startIL);
        const chainage = parseFloat(reading.targetChainage);
        const gradeValue = parseFloat(reading.gradeValue);
        const gradePercent = reading.gradeMode === 'percent' ? 
            gradeValue : 
            100 / gradeValue;
        const ilAtChainage = parseFloat(reading.results.ilAtChainage);
        
        section += `START IL - ${startIL.toFixed(3)}\n`;
        section += `CHAINAGE - ${chainage.toFixed(2)}\n`;
        section += `GRADE - ${gradePercent.toFixed(3)}%\n`;
        section += `IL AT CHAINAGE - ${ilAtChainage.toFixed(3)}\n\n`;
        
        if (reading.notes) {
            section += `- ${reading.notes}\n\n`;
        }
        
        if (index < readings.length - 1) {
            section += '\n';
        }
    });
    
    section += '\n';
    return section;
}

/**
 * Generate General Notes section
 */
function generateGeneralNotesSection() {
    const notes = appState.generalNotes.notes.filter(n => n.content && n.content.trim() !== '');
    if (notes.length === 0) return '';
    
    let section = `GENERAL NOTES\n\n`;
    
    notes.forEach((note, index) => {
        if (note.content.trim()) {
            section += `${note.content.trim()}`;
            if (index < notes.length - 1) {
                section += '\n\n';
            }
        }
    });
    
    return section;
}
