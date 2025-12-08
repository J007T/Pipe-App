/**
 * PurposeMobile Field Tools - Laser Converter Tool
 * Converts between grade ratios and laser percentages
 */

import { appState, autoSaveState } from '../state.js';
import { showNotification, formatRatio } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Add new laser conversion reading
 */
export function addLaserReading() {
    appState.laser.readingCounter++;
    const reading = {
        id: appState.laser.readingCounter,
        sectionId: '',
        gradeRatio: null,
        laserPercent: null,
        notes: ''
    };
    
    appState.laser.readings.push(reading);
    renderLaserReadings();
    updateUnifiedPreview();
    showNotification('Laser conversion added');
    autoSaveState();
}

/**
 * Delete laser reading
 */
export function deleteLaserReading(id) {
    if (appState.laser.readings.length === 1) {
        showNotification('Must keep at least one conversion', 'error');
        return;
    }
    
    appState.laser.readings = appState.laser.readings.filter(r => r.id !== id);
    renderLaserReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Conversion deleted');
    autoSaveState();
}

/**
 * Move reading up in order
 */
export function moveLaserReadingUp(index) {
    if (index === 0) return;
    [appState.laser.readings[index - 1], appState.laser.readings[index]] = 
    [appState.laser.readings[index], appState.laser.readings[index - 1]];
    renderLaserReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Conversion moved up');
    autoSaveState();
}

/**
 * Move reading down in order
 */
export function moveLaserReadingDown(index) {
    if (index === appState.laser.readings.length - 1) return;
    [appState.laser.readings[index], appState.laser.readings[index + 1]] = 
    [appState.laser.readings[index + 1], appState.laser.readings[index]];
    renderLaserReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Conversion moved down');
    autoSaveState();
}

/**
 * Update laser reading field
 * Automatically calculates the opposite value (ratio â†” percent)
 */
export function updateLaserReading(index, field, value) {
    const reading = appState.laser.readings[index];
    if (!reading) return;
    
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    
    if (field === 'gradeRatio') {
        if (trimmedValue === '' || trimmedValue === null) {
            reading.gradeRatio = null;
            reading.laserPercent = null;
        } else {
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue) && numValue > 0) {
                reading.gradeRatio = numValue;
                reading.laserPercent = 100 / numValue;
            }
        }
    } else if (field === 'laserPercent') {
        if (trimmedValue === '' || trimmedValue === null) {
            reading.gradeRatio = null;
            reading.laserPercent = null;
        } else {
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue) && numValue > 0) {
                reading.laserPercent = numValue;
                reading.gradeRatio = 100 / numValue;
            }
        }
    } else {
        reading[field] = trimmedValue;
    }
    
    renderLaserReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    autoSaveState();
}

/**
 * Render all laser readings
 */
export function renderLaserReadings() {
    const container = document.getElementById('laserReadingsContainer');
    
    if (appState.laser.readings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exchange-alt"></i><p>No conversions yet</p><p class="small">Click "Add Conversion" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.laser.readings.map((reading, index) => {
        const hasCalculation = reading.gradeRatio || reading.laserPercent;
        let resultHtml = '';
        
        if (hasCalculation) {
            const ratio = reading.gradeRatio || (100 / reading.laserPercent);
            const percent = reading.laserPercent || (100 / reading.gradeRatio);
            const risePerMeter = percent / 100;
            const risePer6m = risePerMeter * 6;
            
            const ratioDisplay = formatRatio(ratio);
            
            resultHtml = `
                <div class="result-display">
                    <div class="result-label">Laser Grade</div>
                    <div class="result-value">${percent.toFixed(4)}%</div>
                    <div class="result-detail">Ratio: 1 in ${ratioDisplay}</div>
                    <div class="result-detail">Rise per 1m: ${(risePerMeter * 1000).toFixed(1)}mm</div>
                    <div class="result-detail">Rise per 6m: ${(risePer6m * 1000).toFixed(1)}mm</div>
                </div>
            `;
        }
        
        return `
            <div class="reading-card" id="laserReading-${reading.id}">
                <div class="reading-card-header" onclick="window.toggleReadingCard('laserReading-${reading.id}')">
                    <div class="reading-number">
                        <i class="fas fa-bullseye"></i>
                        Conversion ${index + 1}
                    </div>
                    <div class="reading-controls">
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveLaserReadingUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveLaserReadingDown(${index})" ${index === appState.laser.readings.length - 1 ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.deleteLaserReading(${reading.id})" title="Delete">
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
                                onchange="window.updateLaserReading(${index}, 'sectionId', this.value)"
                            >
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-divide label-icon"></i>Grade Ratio (1 in X)</label>
                                <input 
                                    type="number" 
                                    value="${reading.gradeRatio || ''}" 
                                    placeholder="e.g., 90"
                                    step="0.001"
                                    onchange="window.updateLaserReading(${index}, 'gradeRatio', this.value)"
                                >
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-percentage label-icon"></i>OR Laser %</label>
                                <input 
                                    type="number" 
                                    value="${reading.laserPercent || ''}" 
                                    placeholder="e.g., 1.1111"
                                    step="0.0001"
                                    onchange="window.updateLaserReading(${index}, 'laserPercent', this.value)"
                                >
                            </div>
                        </div>
                        
                        ${resultHtml}
                        
                        <div class="form-group">
                            <label><i class="fas fa-sticky-note label-icon"></i>Notes (Optional)</label>
                            <textarea 
                                placeholder="e.g., Equipment setup notes..."
                                onchange="window.updateLaserReading(${index}, 'notes', this.value)">${reading.notes}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Clear all laser conversion data
 */
export function clearLaserToolData() {
    if (appState.laser.readings.length === 0) {
        showNotification('No laser data to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all laser conversion data? This cannot be undone.')) return;
    
    appState.laser.readings = [];
    appState.laser.readingCounter = 0;
    
    addLaserReading(); // Add one empty reading back
    updateUnifiedPreview();
    showNotification('Laser data cleared');
    autoSaveState();
}
