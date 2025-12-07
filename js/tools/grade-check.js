/**
 * PurposeMobile Field Tools - Grade Check Tool
 * Verifies as-constructed grades against design specifications
 */

import { appState } from '../state.js';
import { showNotification } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Add new grade check reading
 */
export function addGradeCheckReading() {
    appState.gradeCheck.readingCounter++;
    const readingId = appState.gradeCheck.readingCounter;
    
    const reading = {
        id: readingId,
        sectionId: '',
        downstreamIL: null,
        upstreamIL: null,
        length: null,
        designGrade: null,
        gradeMode: 'percent',
        designRise: null,
        designRisePerMeter: null,
        actualGrade: null,
        actualRise: null,
        actualRisePerMeter: null,
        percentageDifference: null,
        riseFallDifference: null,
        status: null,
        notes: ''
    };
    
    appState.gradeCheck.readings.push(reading);
    renderGradeCheckReadings();
    updateUnifiedPreview();
    showNotification('Verification section added');
}

/**
 * Remove grade check reading
 */
export function removeGradeCheckReading(id) {
    if (appState.gradeCheck.readings.length === 1) {
        showNotification('Cannot remove the last section', 'error');
        return;
    }
    
    appState.gradeCheck.readings = appState.gradeCheck.readings.filter(r => r.id !== id);
    renderGradeCheckReadings();
    updateUnifiedPreview();
    showNotification('Section removed');
}

/**
 * Move reading up in order
 */
export function moveGradeCheckReadingUp(index) {
    if (index === 0) return;
    [appState.gradeCheck.readings[index - 1], appState.gradeCheck.readings[index]] = 
    [appState.gradeCheck.readings[index], appState.gradeCheck.readings[index - 1]];
    renderGradeCheckReadings();
    updateUnifiedPreview();
    showNotification('Section moved up');
}

/**
 * Move reading down in order
 */
export function moveGradeCheckReadingDown(index) {
    if (index === appState.gradeCheck.readings.length - 1) return;
    [appState.gradeCheck.readings[index], appState.gradeCheck.readings[index + 1]] = 
    [appState.gradeCheck.readings[index + 1], appState.gradeCheck.readings[index]];
    renderGradeCheckReadings();
    updateUnifiedPreview();
    showNotification('Section moved down');
}

/**
 * Update and calculate grade check reading
 * CRITICAL: Maintains full precision until final display
 */
export function updateGradeCheckReading(id) {
    const reading = appState.gradeCheck.readings.find(r => r.id === id);
    if (!reading) return;
    
    const card = document.getElementById(`gradeCheckReading-${id}`);
    if (card) {
        card.classList.add('calculating');
    }
    
    const sectionIdInput = document.getElementById(`sectionId-${id}`);
    const sectionId = sectionIdInput ? sectionIdInput.value.trim() : '';
    const downstream = getGradeCheckInputValue(`downstream-${id}`);
    const upstream = getGradeCheckInputValue(`upstream-${id}`);
    const length = getGradeCheckInputValue(`length-${id}`);
    const designGrade = reading.gradeMode === 'percent' ? 
        getGradeCheckInputValue(`gradePercent-${id}`) : 
        getGradeCheckInputValue(`gradeRatio-${id}`);
    const notesInput = document.getElementById(`notes-${id}`);
    const notes = notesInput ? notesInput.value.trim() : '';
    
    reading.sectionId = sectionId;
    reading.downstreamIL = downstream;
    reading.upstreamIL = upstream;
    reading.length = length;
    reading.designGrade = designGrade;
    reading.notes = notes;
    
    // Calculate if all values present
    if (downstream !== null && upstream !== null && length !== null && designGrade !== null && length > 0) {
        const rise = upstream - downstream;
        
        // Convert design grade to percentage (full precision)
        const designGradePercent = reading.gradeMode === 'percent' ? 
            designGrade : 
            100 / designGrade;
        
        // Design calculations (full precision)
        reading.designRise = length * (designGradePercent / 100);
        reading.designRisePerMeter = (reading.designRise / length) * 1000;
        
        // As-constructed calculations (full precision)
        reading.actualGrade = (rise / length) * 100;
        reading.actualRise = rise;
        reading.actualRisePerMeter = (rise / length) * 1000;
        
        // Differences
        reading.percentageDifference = Math.abs(reading.actualGrade - designGradePercent);
        reading.riseFallDifference = Math.abs(reading.actualRise - reading.designRise);
        
        reading.status = 'calculated';
        
        const resultDiv = document.getElementById(`gradeCheckResult-${id}`);
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="result-label">Verification Summary</div>
                <div class="result-value">Design: ${designGradePercent.toFixed(3)}% | As-Con: ${reading.actualGrade.toFixed(3)}%</div>
                <div class="result-detail">Design Rise: ${reading.designRise.toFixed(3)}m (${reading.designRisePerMeter.toFixed(3)}mm/m)</div>
                <div class="result-detail">As-Con Rise: ${reading.actualRise.toFixed(3)}m (${reading.actualRisePerMeter.toFixed(3)}mm/m)</div>
                <div class="result-detail">Difference: ${reading.percentageDifference.toFixed(3)}% | ${reading.riseFallDifference.toFixed(3)}m</div>
            `;
            resultDiv.classList.remove('hidden');
        }
    } else {
        reading.actualGrade = null;
        reading.status = null;
        const resultDiv = document.getElementById(`gradeCheckResult-${id}`);
        if (resultDiv) {
            resultDiv.classList.add('hidden');
        }
    }
    
    // Remove calculating animation
    setTimeout(() => {
        if (card) {
            card.classList.remove('calculating');
        }
    }, 300);
    
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
}

/**
 * Get input value helper
 */
function getGradeCheckInputValue(id) {
    const input = document.getElementById(id);
    if (!input) return null;
    const value = parseFloat(input.value);
    return isNaN(value) ? null : value;
}

/**
 * Toggle grade mode (percent/ratio)
 */
export function toggleGradeCheckGradeMode(id, mode) {
    const reading = appState.gradeCheck.readings.find(r => r.id === id);
    if (!reading) return;
    
    reading.gradeMode = mode;
    reading.designGrade = null;
    renderGradeCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification(`Switched to ${mode === 'percent' ? 'percentage' : 'ratio'} mode`);
}

/**
 * Render all grade check readings
 */
export function renderGradeCheckReadings() {
    const container = document.getElementById('gradeCheckReadingsContainer');
    
    if (appState.gradeCheck.readings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-double"></i><p>No verifications yet</p><p class="small">Click "Add Verification Section" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.gradeCheck.readings.map((reading, index) => `
        <div class="reading-card" id="gradeCheckReading-${reading.id}">
            <div class="reading-card-header" onclick="window.toggleReadingCard('gradeCheckReading-${reading.id}')">
                <span class="reading-number">Section ${index + 1}</span>
                <div class="reading-controls">
                    <button class="control-btn" onclick="event.stopPropagation(); window.moveGradeCheckReadingUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="control-btn" onclick="event.stopPropagation(); window.moveGradeCheckReadingDown(${index})" ${index === appState.gradeCheck.readings.length - 1 ? 'disabled' : ''} title="Move Down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.removeGradeCheckReading(${reading.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="reading-card-content">
                <div style="padding: 18px;">
                    <div class="form-group">
                        <label for="sectionId-${reading.id}"><i class="fas fa-map-marker-alt label-icon"></i>Section ID</label>
                        <input type="text" id="sectionId-${reading.id}" 
                               placeholder="e.g., 79-MH05 to 79-MH06"
                               value="${reading.sectionId}"
                               oninput="window.updateGradeCheckReading(${reading.id})">
                    </div>

                    <div class="form-row">
                        <div>
                            <label for="downstream-${reading.id}"><i class="fas fa-arrow-down label-icon"></i>Downstream IL (m)</label>
                            <input type="number" id="downstream-${reading.id}" 
                                   placeholder="e.g., 179.250" step="0.001"
                                   value="${reading.downstreamIL !== null ? reading.downstreamIL : ''}"
                                   oninput="window.updateGradeCheckReading(${reading.id})">
                        </div>
                        <div>
                            <label for="upstream-${reading.id}"><i class="fas fa-arrow-up label-icon"></i>Upstream IL (m)</label>
                            <input type="number" id="upstream-${reading.id}" 
                                   placeholder="e.g., 179.730" step="0.001"
                                   value="${reading.upstreamIL !== null ? reading.upstreamIL : ''}"
                                   oninput="window.updateGradeCheckReading(${reading.id})">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="length-${reading.id}"><i class="fas fa-ruler-horizontal label-icon"></i>Pipe Length (m)</label>
                        <input type="number" id="length-${reading.id}" 
                               placeholder="e.g., 43.18" step="0.01"
                               value="${reading.length !== null ? reading.length : ''}"
                               oninput="window.updateGradeCheckReading(${reading.id})">
                    </div>

                    <div class="mode-toggle">
                        <div class="mode-btn ${reading.gradeMode === 'percent' ? 'active' : ''}" onclick="window.toggleGradeCheckGradeMode(${reading.id}, 'percent')">Percentage (%)</div>
                        <div class="mode-btn ${reading.gradeMode === 'ratio' ? 'active' : ''}" onclick="window.toggleGradeCheckGradeMode(${reading.id}, 'ratio')">Ratio (1 in X)</div>
                    </div>

                    <div id="percentInput-${reading.id}" ${reading.gradeMode !== 'percent' ? 'class="hidden"' : ''}>
                        <div class="form-group">
                            <label for="gradePercent-${reading.id}"><i class="fas fa-percentage label-icon"></i>Design Grade (%)</label>
                            <input type="number" id="gradePercent-${reading.id}" 
                                   placeholder="e.g., 1.111" step="0.001"
                                   value="${reading.gradeMode === 'percent' && reading.designGrade !== null ? reading.designGrade : ''}"
                                   oninput="window.updateGradeCheckReading(${reading.id})">
                        </div>
                    </div>

                    <div id="ratioInput-${reading.id}" ${reading.gradeMode !== 'ratio' ? 'class="hidden"' : ''}>
                        <div class="form-group">
                            <label for="gradeRatio-${reading.id}"><i class="fas fa-divide label-icon"></i>Design Grade (1 in X)</label>
                            <input type="number" id="gradeRatio-${reading.id}" 
                                   placeholder="e.g., 90" step="0.001"
                                   value="${reading.gradeMode === 'ratio' && reading.designGrade !== null ? reading.designGrade : ''}"
                                   oninput="window.updateGradeCheckReading(${reading.id})">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes-${reading.id}"><i class="fas fa-sticky-note label-icon"></i>Notes (Optional)</label>
                        <textarea id="notes-${reading.id}" 
                                  placeholder="Additional notes for this section..." 
                                  oninput="window.updateGradeCheckReading(${reading.id})">${reading.notes || ''}</textarea>
                    </div>
                    
                    <div id="gradeCheckResult-${reading.id}" class="result-display ${reading.status ? '' : 'hidden'}"></div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Clear all grade check data
 */
export function clearGradeCheckToolData() {
    if (appState.gradeCheck.readings.length === 0) {
        showNotification('No grade check data to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all grade verification data? This cannot be undone.')) return;
    
    appState.gradeCheck.readings = [];
    appState.gradeCheck.readingCounter = 0;
    
    addGradeCheckReading(); // Add one empty reading back
    updateUnifiedPreview();
    showNotification('Grade check data cleared');
}
