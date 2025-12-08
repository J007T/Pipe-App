/**
 * PurposeMobile Field Tools - Chainage IL Tool
 * Calculates invert level at any chainage along pipeline
 */

import { appState, autoSaveState } from '../state.js';
import { showNotification, formatRatio } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Calculate grade values helper
 */
function calculateGradeValues(mode, value) {
    if (mode === 'percent') {
        return {
            percent: value,
            ratio: 100 / value,
            risePerMeter: value / 100
        };
    } else {
        return {
            percent: 100 / value,
            ratio: value,
            risePerMeter: 1 / value
        };
    }
}

/**
 * Add new chainage IL calculation
 */
export function addChainageILReading() {
    appState.chainageIL.readingCounter++;
    const reading = {
        id: appState.chainageIL.readingCounter,
        sectionId: '',
        startIL: null,
        targetChainage: null,
        gradeMode: 'percent',
        gradeValue: null,
        notes: '',
        calculated: false,
        results: null
    };
    
    appState.chainageIL.readings.push(reading);
    renderChainageILReadings();
    updateUnifiedPreview();
    showNotification('Chainage calculation added');
    autoSaveState();
}

/**
 * Delete chainage IL reading
 */
export function deleteChainageILReading(id) {
    if (appState.chainageIL.readings.length === 1) {
        showNotification('Must keep at least one calculation', 'error');
        return;
    }
    
    appState.chainageIL.readings = appState.chainageIL.readings.filter(r => r.id !== id);
    renderChainageILReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation deleted');
    autoSaveState();
}

/**
 * Move reading up in order
 */
export function moveChainageILReadingUp(index) {
    if (index === 0) return;
    [appState.chainageIL.readings[index - 1], appState.chainageIL.readings[index]] = 
    [appState.chainageIL.readings[index], appState.chainageIL.readings[index - 1]];
    renderChainageILReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation moved up');
    autoSaveState();
}

/**
 * Move reading down in order
 */
export function moveChainageILReadingDown(index) {
    if (index === appState.chainageIL.readings.length - 1) return;
    [appState.chainageIL.readings[index], appState.chainageIL.readings[index + 1]] = 
    [appState.chainageIL.readings[index + 1], appState.chainageIL.readings[index]];
    renderChainageILReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation moved down');
    autoSaveState();
}

/**
 * Update chainage IL reading field
 */
export function updateChainageILReading(index, field, value) {
    const reading = appState.chainageIL.readings[index];
    if (!reading) return;
    
    if (field === 'gradeMode') {
        reading.gradeMode = value;
        reading.gradeValue = null;
    } else {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        
        if (field === 'startIL' || field === 'targetChainage' || field === 'gradeValue') {
            if (trimmedValue === '' || trimmedValue === null) {
                reading[field] = null;
            } else {
                const numValue = parseFloat(trimmedValue);
                if (!isNaN(numValue)) {
                    reading[field] = numValue;
                }
            }
        } else {
            reading[field] = trimmedValue;
        }
    }
    
    // Auto-calculate if all required fields are present
    if (reading.startIL !== null && reading.targetChainage !== null && reading.gradeValue !== null && reading.gradeValue > 0) {
        calculateChainageILReading(index);
    } else {
        reading.calculated = false;
        reading.results = null;
    }
    
    renderChainageILReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    autoSaveState();
}

/**
 * Toggle grade mode (percent/ratio)
 */
export function toggleChainageILGradeMode(index, mode) {
    updateChainageILReading(index, 'gradeMode', mode);
    autoSaveState();
}

/**
 * Calculate chainage IL
 * CRITICAL: Maintains full precision until final display
 */
export function calculateChainageILReading(index) {
    const reading = appState.chainageIL.readings[index];
    if (!reading) return;
    
    const startIL = reading.startIL;
    const chainage = reading.targetChainage;
    const gradeValue = reading.gradeValue;
    const mode = reading.gradeMode;
    
    // Calculate rise per metre (full precision - no rounding)
    const risePerMetre = mode === 'percent' ? (gradeValue / 100) : (1 / gradeValue);
    
    // Total rise over distance (full precision - no rounding)
    const totalRise = risePerMetre * chainage;
    
    // IL at chainage (full precision, round only for display)
    const ilAtChainage = startIL + totalRise;
    
    // Store results
    reading.results = {
        risePerMetre: risePerMetre,
        totalRise: totalRise,
        ilAtChainage: ilAtChainage
    };
    reading.calculated = true;
    
    renderChainageILReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    autoSaveState();
}

/**
 * Render all chainage IL readings
 */
export function renderChainageILReadings() {
    const container = document.getElementById('chainageILReadingsContainer');
    
    if (appState.chainageIL.readings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-map-marker-alt"></i><p>No calculations yet</p><p class="small">Click "Add Chainage Calculation" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.chainageIL.readings.map((reading, index) => {
        const hasCalculation = reading.calculated && reading.results;
        let resultHtml = '';
        let converterHtml = '';
        
        if (reading.gradeValue !== null && reading.gradeValue > 0) {
            if (reading.gradeMode === 'percent') {
                const calc = calculateGradeValues('percent', reading.gradeValue);
                converterHtml = `<div class="converter-text">≈ 1 in ${formatRatio(calc.ratio)} | Rise: ${calc.risePerMeter.toFixed(4)} m/m</div>`;
            } else {
                const calc = calculateGradeValues('ratio', reading.gradeValue);
                converterHtml = `<div class="converter-text">≈ ${calc.percent.toFixed(3)}% | Rise: ${calc.risePerMeter.toFixed(4)} m/m</div>`;
            }
        }
        
        if (hasCalculation) {
            resultHtml = `
                <div class="result-display">
                    <div class="result-label">Chainage IL Result</div>
                    <div class="result-value">${reading.results.ilAtChainage.toFixed(3)}m</div>
                    <div class="result-detail">IL at CH ${reading.targetChainage.toFixed(2)}: ${reading.results.ilAtChainage.toFixed(3)}m</div>
                    <div class="result-detail">Rise: ${reading.results.totalRise.toFixed(3)}m (${reading.results.risePerMetre.toFixed(4)}m/m)</div>
                </div>
            `;
        }
        
        return `
            <div class="reading-card" id="chainageILReading-${reading.id}">
                <div class="reading-card-header" onclick="window.toggleReadingCard('chainageILReading-${reading.id}')">
                    <div class="reading-number">
                        <i class="fas fa-map-marker-alt"></i>
                        Calculation ${index + 1}
                    </div>
                    <div class="reading-controls">
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveChainageILReadingUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveChainageILReadingDown(${index})" ${index === appState.chainageIL.readings.length - 1 ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.deleteChainageILReading(${reading.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="reading-card-content">
                    <div style="padding: 18px;">
                        <div class="form-group">
                            <label><i class="fas fa-map-marker-alt label-icon"></i>Section ID (Optional)</label>
                            <input 
                                type="text" 
                                value="${reading.sectionId}" 
                                placeholder="e.g., MH05 to MH06"
                                onchange="window.updateChainageILReading(${index}, 'sectionId', this.value)"
                            >
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-arrow-down label-icon"></i>Start IL (m)</label>
                                <input 
                                    type="number" 
                                    value="${reading.startIL !== null ? reading.startIL : ''}" 
                                    placeholder="e.g., 179.250"
                                    step="0.001"
                                    onchange="window.updateChainageILReading(${index}, 'startIL', this.value)"
                                >
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-ruler-horizontal label-icon"></i>Chainage (m)</label>
                                <input 
                                    type="number" 
                                    value="${reading.targetChainage !== null ? reading.targetChainage : ''}" 
                                    placeholder="e.g., 20.00"
                                    step="0.01"
                                    onchange="window.updateChainageILReading(${index}, 'targetChainage', this.value)"
                                >
                            </div>
                        </div>

                        <div class="radio-toggle">
                            <div class="radio-option">
                                <input type="radio" id="chainagePercent-${reading.id}" name="chainageMode-${reading.id}" value="percent" ${reading.gradeMode === 'percent' ? 'checked' : ''}>
                                <label for="chainagePercent-${reading.id}">Percentage (%)</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" id="chainageRatio-${reading.id}" name="chainageMode-${reading.id}" value="ratio" ${reading.gradeMode === 'ratio' ? 'checked' : ''}>
                                <label for="chainageRatio-${reading.id}">Ratio (1 in X)</label>
                            </div>
                        </div>

                        ${reading.gradeMode === 'percent' ? `
                        <div class="form-group">
                            <label><i class="fas fa-percentage label-icon"></i>Grade (%)</label>
                            <input 
                                type="number" 
                                value="${reading.gradeValue !== null ? reading.gradeValue : ''}" 
                                placeholder="e.g., 1.111"
                                step="0.001"
                                onchange="window.updateChainageILReading(${index}, 'gradeValue', this.value)"
                            >
                            ${converterHtml}
                        </div>
                        ` : `
                        <div class="form-group">
                            <label><i class="fas fa-divide label-icon"></i>Grade (1 in X)</label>
                            <input 
                                type="number" 
                                value="${reading.gradeValue !== null ? reading.gradeValue : ''}" 
                                placeholder="e.g., 90"
                                step="0.001"
                                onchange="window.updateChainageILReading(${index}, 'gradeValue', this.value)"
                            >
                            ${converterHtml}
                        </div>
                        `}
                        
                        ${resultHtml}
                        
                        <div class="formula-display">
                            <div class="formula-title">Calculation Steps:</div>
                            <div class="formula-step">1. Rise per metre = Grade % Ã· 100 OR 1 Ã· Ratio</div>
                            <div class="formula-step">2. Total Rise = Rise per metre Ã— Distance</div>
                            <div class="formula-step">3. IL at Chainage = Start IL + Total Rise</div>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-sticky-note label-icon"></i>Notes (Optional)</label>
                            <textarea 
                                placeholder="e.g., Calculation notes..."
                                onchange="window.updateChainageILReading(${index}, 'notes', this.value)">${reading.notes}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Clear all chainage IL data
 */
export function clearChainageILData() {
    if (appState.chainageIL.readings.length === 0) {
        showNotification('No chainage data to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all chainage calculation data? This cannot be undone.')) return;
    
    appState.chainageIL.readings = [];
    appState.chainageIL.readingCounter = 0;
    
    addChainageILReading(); // Add one empty reading back
    updateUnifiedPreview();
    showNotification('Chainage data cleared');
    autoSaveState();
}
