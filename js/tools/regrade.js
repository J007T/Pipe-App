/**
 * PurposeMobile Field Tools - Regrade Tool
 * Calculates required grade changes between points
 */

import { appState } from '../state.js';
import { showNotification, formatRatio } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Format to three decimals helper
 */
function formatToThreeDecimals(num) {
    if (isNaN(num)) return '--';
    return num.toFixed(3);
}

/**
 * Add new regrade calculation
 */
export function addRegradeReading() {
    const reading = {
        id: ++appState.regrade.readingCounter,
        sectionId: '',
        gradeMode: 'percent',
        currentGrade: '',
        currentRatio: '',
        distance: '',
        currentHeight: '',
        targetHeight: '',
        chainage: '',
        notes: '',
        calculated: false,
        results: null
    };
    
    appState.regrade.readings.push(reading);
    renderRegradeReadings();
    showNotification('Regrade calculation added');
}

/**
 * Delete regrade reading
 */
export function deleteRegradeReading(index) {
    if (appState.regrade.readings.length === 1) {
        showNotification('Cannot delete the last calculation', 'error');
        return;
    }
    
    appState.regrade.readings.splice(index, 1);
    renderRegradeReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation deleted');
}

/**
 * Move reading up in order
 */
export function moveRegradeReadingUp(index) {
    if (index === 0) return;
    [appState.regrade.readings[index - 1], appState.regrade.readings[index]] = 
    [appState.regrade.readings[index], appState.regrade.readings[index - 1]];
    renderRegradeReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation moved up');
}

/**
 * Move reading down in order
 */
export function moveRegradeReadingDown(index) {
    if (index === appState.regrade.readings.length - 1) return;
    [appState.regrade.readings[index], appState.regrade.readings[index + 1]] = 
    [appState.regrade.readings[index + 1], appState.regrade.readings[index]];
    renderRegradeReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Calculation moved down');
}

/**
 * Update regrade reading field
 */
export function updateRegradeReading(index, field, value) {
    if (appState.regrade.readings[index]) {
        appState.regrade.readings[index][field] = value;
        appState.manualPreviewEdit = false;
        updateUnifiedPreview();
    }
}

/**
 * Toggle grade mode (percent/ratio)
 */
export function toggleRegradeReadingGradeMode(index, mode) {
    if (appState.regrade.readings[index]) {
        appState.regrade.readings[index].gradeMode = mode;
        renderRegradeReadings();
        appState.manualPreviewEdit = false;
        updateUnifiedPreview();
    }
}

/**
 * Calculate regrade requirements
 * CRITICAL: Maintains full precision until final display
 */
export function calculateRegradeReading(index) {
    const reading = appState.regrade.readings[index];
    const card = document.getElementById(`regradeReading-${reading.id}`);
    
    // Validation
    const mode = reading.gradeMode;
    const currentGradeValue = mode === 'percent' ? parseFloat(reading.currentGrade) : parseFloat(reading.currentRatio);
    const distance = parseFloat(reading.distance);
    const currentHeight = parseFloat(reading.currentHeight);
    const targetHeight = parseFloat(reading.targetHeight);
    
    if (isNaN(currentGradeValue) || currentGradeValue <= 0) {
        showNotification('Please enter a valid current grade value', 'error');
        return;
    }
    if (isNaN(distance) || distance <= 0) {
        showNotification('Please enter a valid distance', 'error');
        return;
    }
    if (isNaN(currentHeight)) {
        showNotification('Please enter a valid current height', 'error');
        return;
    }
    if (isNaN(targetHeight)) {
        showNotification('Please enter a valid target height', 'error');
        return;
    }
    
    // Add calculating animation
    if (card) {
        card.classList.add('calculating');
    }
    
    // Calculate current grade in percentage (full precision)
    const currentGradePercent = mode === 'percent' ? currentGradeValue : 100 / currentGradeValue;
    
    // Calculate required new grade (full precision)
    const heightDiff = targetHeight - currentHeight;
    const newGradePercent = (heightDiff / distance) * 100;
    const newGradeRatio = 100 / Math.abs(newGradePercent);
    
    // Calculate changes
    const gradeChange = newGradePercent - currentGradePercent;
    const heightDiffMm = heightDiff * 1000;
    
    // Calculate 6m pipe adjustment
    const adjustmentPer6m = (heightDiff / distance) * 6 * 1000;
    
    // Store results
    reading.results = {
        newGradePercent: formatToThreeDecimals(newGradePercent),
        newGradeRatio: formatToThreeDecimals(newGradeRatio),
        gradeChange: `${gradeChange >= 0 ? '+' : ''}${formatToThreeDecimals(gradeChange)}`,
        heightChange: `${heightDiff >= 0 ? '+' : ''}${formatToThreeDecimals(heightDiff)}`,
        adjustmentPer6m: `${adjustmentPer6m >= 0 ? '+' : ''}${adjustmentPer6m.toFixed(0)}`
    };
    reading.calculated = true;
    
    // Remove calculating animation and update
    setTimeout(() => {
        if (card) {
            card.classList.remove('calculating');
        }
        renderRegradeReadings();
        updateUnifiedPreview();
        showNotification('Regrade calculation completed');
    }, 300);
}

/**
 * Render all regrade readings
 */
export function renderRegradeReadings() {
    const container = document.getElementById('regradeReadingsContainer');
    
    if (appState.regrade.readings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calculator"></i><p>No calculations yet</p><p class="small">Click "Add Regrade Calculation" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.regrade.readings.map((reading, index) => `
        <div class="reading-card" id="regradeReading-${reading.id}">
            <div class="reading-card-header" onclick="window.toggleReadingCard('regradeReading-${reading.id}')">
                <div class="reading-number">
                    <i class="fas fa-calculator"></i> Calculation ${index + 1}
                </div>
                <div class="reading-controls">
                    <button class="control-btn" onclick="event.stopPropagation(); window.moveRegradeReadingUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="control-btn" onclick="event.stopPropagation(); window.moveRegradeReadingDown(${index})" ${index === appState.regrade.readings.length - 1 ? 'disabled' : ''} title="Move Down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.deleteRegradeReading(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="reading-card-content">
                <div style="padding: 18px;">
                    <div class="form-group">
                        <label><i class="fas fa-map-marker-alt label-icon"></i>Section ID</label>
                        <input type="text" value="${reading.sectionId}" onchange="window.updateRegradeReading(${index}, 'sectionId', this.value)" placeholder="e.g., MH01 to MH02">
                    </div>

                    <div class="mode-toggle">
                        <div class="mode-btn ${reading.gradeMode === 'percent' ? 'active' : ''}" onclick="window.toggleRegradeReadingGradeMode(${index}, 'percent')">Percentage (%)</div>
                        <div class="mode-btn ${reading.gradeMode === 'ratio' ? 'active' : ''}" onclick="window.toggleRegradeReadingGradeMode(${index}, 'ratio')">Ratio (1 in X)</div>
                    </div>

                    ${reading.gradeMode === 'percent' ? `
                    <div class="form-group">
                        <label><i class="fas fa-percentage label-icon"></i>Current Grade (%)</label>
                        <input type="number" value="${reading.currentGrade}" onchange="window.updateRegradeReading(${index}, 'currentGrade', this.value)" placeholder="e.g., 2.5" step="0.001">
                    </div>
                    ` : `
                    <div class="form-group">
                        <label><i class="fas fa-divide label-icon"></i>Current Ratio (1 in X)</label>
                        <input type="number" value="${reading.currentRatio}" onchange="window.updateRegradeReading(${index}, 'currentRatio', this.value)" placeholder="e.g., 50" step="0.001">
                    </div>
                    `}

                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-ruler-horizontal label-icon"></i>Distance (m)</label>
                            <input type="number" value="${reading.distance}" onchange="window.updateRegradeReading(${index}, 'distance', this.value)" placeholder="Horizontal distance" step="0.001">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-link label-icon"></i>Chainage (Optional)</label>
                            <input type="number" value="${reading.chainage}" onchange="window.updateRegradeReading(${index}, 'chainage', this.value)" placeholder="Pipeline position" step="0.01">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-arrow-down label-icon"></i>Current IL (m)</label>
                            <input type="number" value="${reading.currentHeight}" onchange="window.updateRegradeReading(${index}, 'currentHeight', this.value)" placeholder="Current pipe height" step="0.001">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-arrow-up label-icon"></i>Target IL (m)</label>
                            <input type="number" value="${reading.targetHeight}" onchange="window.updateRegradeReading(${index}, 'targetHeight', this.value)" placeholder="Required height" step="0.001">
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fas fa-sticky-note label-icon"></i>Notes (Optional)</label>
                        <textarea onchange="window.updateRegradeReading(${index}, 'notes', this.value)" placeholder="Add any notes for this regrade...">${reading.notes}</textarea>
                    </div>

                    <button type="button" class="btn btn-primary" style="width: 100%;" onclick="window.calculateRegradeReading(${index})">
                        <i class="fas fa-calculator"></i> Calculate Regrade
                    </button>

                    ${reading.calculated && reading.results ? `
                    <div class="result-display" style="margin-top: 15px;">
                        <div class="result-label">Regrade Results</div>
                        <div class="result-value">New Grade: ${reading.results.newGradePercent}%</div>
                        <div class="result-detail">New Ratio: 1 in ${reading.results.newGradeRatio}</div>
                        <div class="result-detail">Grade Change: ${reading.results.gradeChange}%</div>
                        <div class="result-detail">Height Adjustment: ${reading.results.heightChange}m</div>
                        <div class="result-detail">6m Pipe Adjustment: ${reading.results.adjustmentPer6m}mm</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Clear all regrade data
 */
export function clearRegradeToolData() {
    if (appState.regrade.readings.length === 0) {
        showNotification('No regrade data to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all regrade calculation data? This cannot be undone.')) return;
    
    appState.regrade.readings = [];
    appState.regrade.readingCounter = 0;
    
    addRegradeReading(); // Add one empty reading back
    updateUnifiedPreview();
    showNotification('Regrade data cleared');
}
