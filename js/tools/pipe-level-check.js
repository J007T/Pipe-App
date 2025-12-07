/**
 * PurposeMobile Field Tools - Pipe Level Check Tool
 * Verifies pipe installation against design levels
 */

import { appState } from '../state.js';
import { showNotification, formatRatio } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Add new pipe level check reading
 */
export function addPipeLevelCheckReading() {
    appState.pipeLevelCheck.readingCounter++;
    const reading = {
        id: appState.pipeLevelCheck.readingCounter,
        sectionId: '',
        slopeMode: 'percent',
        slopeValue: null,
        distance: null,
        startHeight: null,
        measuredHeight: null,
        extraDistance: null,
        notes: '',
        calculated: false,
        results: null
    };
    
    appState.pipeLevelCheck.readings.push(reading);
    renderPipeLevelCheckReadings();
    updateUnifiedPreview();
    showNotification('Pipe level check added');
}

/**
 * Delete pipe level check reading
 */
export function deletePipeLevelCheckReading(id) {
    if (appState.pipeLevelCheck.readings.length === 1) {
        showNotification('Must keep at least one check', 'error');
        return;
    }
    
    appState.pipeLevelCheck.readings = appState.pipeLevelCheck.readings.filter(r => r.id !== id);
    renderPipeLevelCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Check deleted');
}

/**
 * Move reading up in order
 */
export function movePipeLevelCheckReadingUp(index) {
    if (index === 0) return;
    [appState.pipeLevelCheck.readings[index - 1], appState.pipeLevelCheck.readings[index]] = 
    [appState.pipeLevelCheck.readings[index], appState.pipeLevelCheck.readings[index - 1]];
    renderPipeLevelCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Check moved up');
}

/**
 * Move reading down in order
 */
export function movePipeLevelCheckReadingDown(index) {
    if (index === appState.pipeLevelCheck.readings.length - 1) return;
    [appState.pipeLevelCheck.readings[index], appState.pipeLevelCheck.readings[index + 1]] = 
    [appState.pipeLevelCheck.readings[index + 1], appState.pipeLevelCheck.readings[index]];
    renderPipeLevelCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Check moved down');
}

/**
 * Update reading field and auto-calculate if ready
 */
export function updatePipeLevelCheckReading(index, field, value) {
    const reading = appState.pipeLevelCheck.readings[index];
    if (!reading) return;
    
    if (field === 'slopeMode') {
        reading.slopeMode = value;
    } else {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        
        if (field === 'slopeValue' || field === 'distance' || field === 'startHeight' || field === 'measuredHeight' || field === 'extraDistance') {
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
    if (reading.slopeValue !== null && reading.slopeValue > 0 && 
        reading.distance !== null && reading.startHeight !== null && reading.measuredHeight !== null) {
        calculatePipeLevelCheckReading(index);
    } else {
        reading.calculated = false;
        reading.results = null;
    }
    
    renderPipeLevelCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
}

/**
 * Toggle slope mode (percent/ratio)
 */
export function togglePipeLevelCheckSlopeMode(index, mode) {
    updatePipeLevelCheckReading(index, 'slopeMode', mode);
}

/**
 * Calculate pipe level check result
 * CRITICAL: Maintains full precision until final display
 */
export function calculatePipeLevelCheckReading(index) {
    const reading = appState.pipeLevelCheck.readings[index];
    if (!reading) return;
    
    const slopeValue = reading.slopeValue;
    const distance = reading.distance;
    const startHeight = reading.startHeight;
    const measuredHeight = reading.measuredHeight;
    const mode = reading.slopeMode;
    
    // Calculate rise per metre (full precision)
    const risePerMetre = mode === 'percent' ? (slopeValue / 100) : (1 / slopeValue);
    
    // Calculate design height (full precision)
    const designHeight = startHeight + (distance * risePerMetre);
    
    // Calculate difference (full precision)
    const difference = measuredHeight - designHeight;
    
    // Determine status
    let status, statusClass;
    if (difference > 0) {
        status = `HIGH +${Math.abs(difference).toFixed(3)}m`;
        statusClass = 'status-high';
    } else if (difference < 0) {
        status = `LOW -${Math.abs(difference).toFixed(3)}m`;
        statusClass = 'status-low';
    } else {
        status = 'LEVEL';
        statusClass = 'status-level';
    }
    
    // Store results
    reading.results = {
        risePerMetre: risePerMetre,
        designHeight: designHeight,
        difference: difference,
        status: status,
        statusClass: statusClass
    };
    reading.calculated = true;
    
    renderPipeLevelCheckReadings();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
}

/**
 * Update calculation with extra distance
 */
export function updatePipeLevelCheckWithExtra(index) {
    const reading = appState.pipeLevelCheck.readings[index];
    if (!reading || !reading.calculated) {
        showNotification('No calculation to update with extra distance', 'error');
        return;
    }
    
    const extraDistanceInput = document.getElementById(`extraDistance-${reading.id}`);
    const extraDistance = parseFloat(extraDistanceInput.value);
    
    if (isNaN(extraDistance) || extraDistance === 0) {
        showNotification('Please enter a valid extra distance', 'error');
        return;
    }
    
    // Update distance and recalculate
    reading.distance += extraDistance;
    reading.extraDistance = extraDistance;
    
    // Recalculate with new distance
    calculatePipeLevelCheckReading(index);
    
    // Clear extra distance input
    extraDistanceInput.value = '';
    
    showNotification('Updated with extra distance');
}

/**
 * Toggle extra distance section visibility
 */
export function toggleExtraDistanceSection(cardId) {
    const section = document.getElementById(`extraDistanceSection-${cardId}`);
    if (section) {
        section.classList.toggle('hidden');
    }
}

/**
 * Render all pipe level check readings
 */
export function renderPipeLevelCheckReadings() {
    const container = document.getElementById('pipeLevelCheckReadingsContainer');
    
    if (appState.pipeLevelCheck.readings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ruler-combined"></i><p>No pipe level checks yet</p><p class="small">Click "Add Pipe Level Check" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.pipeLevelCheck.readings.map((reading, index) => {
        const hasCalculation = reading.calculated && reading.results;
        let resultHtml = '';
        let converterHtml = '';
        
        if (reading.slopeValue !== null && reading.slopeValue > 0) {
            if (reading.slopeMode === 'percent') {
                const ratio = 100 / reading.slopeValue;
                converterHtml = `<div class="converter-text">≈ 1 in ${formatRatio(ratio)} | Rise: ${(reading.slopeValue / 100).toFixed(4)} m/m</div>`;
            } else {
                const percent = 100 / reading.slopeValue;
                converterHtml = `<div class="converter-text">≈ ${percent.toFixed(3)}% | Rise: ${(1 / reading.slopeValue).toFixed(4)} m/m</div>`;
            }
        }
        
        if (hasCalculation) {
            resultHtml = `
                <div class="result-display">
                    <div class="result-label">Pipe Level Check Result</div>
                    <div class="result-value ${reading.results.statusClass.replace('status-', '')}">${reading.results.status}</div>
                    <div class="result-detail">Design Height: ${reading.results.designHeight.toFixed(3)}m</div>
                    <div class="result-detail">Measured Height: ${reading.measuredHeight.toFixed(3)}m</div>
                    <div class="result-detail">Difference: ${reading.results.difference >= 0 ? '+' : ''}${reading.results.difference.toFixed(3)}m</div>
                    <div class="result-detail">Rise per meter: ${reading.results.risePerMetre.toFixed(4)}m/m</div>
                </div>
            `;
        }
        
        return `
            <div class="reading-card" id="pipeLevelCheckReading-${reading.id}">
                <div class="reading-card-header" onclick="window.toggleReadingCard('pipeLevelCheckReading-${reading.id}')">
                    <div class="reading-number">
                        <i class="fas fa-ruler-combined"></i>
                        Check ${index + 1}${hasCalculation ? ` • ${reading.results.status}` : ''}
                    </div>
                    <div class="reading-controls">
                        <button class="control-btn" onclick="event.stopPropagation(); window.movePipeLevelCheckReadingUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="control-btn" onclick="event.stopPropagation(); window.movePipeLevelCheckReadingDown(${index})" ${index === appState.pipeLevelCheck.readings.length - 1 ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.deletePipeLevelCheckReading(${reading.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="reading-card-content">
                    <div style="padding: 18px;">
                        <div class="form-group">
                            <label><i class="fas fa-map-marker-alt label-icon"></i>Section ID</label>
                            <input 
                                type="text" 
                                value="${reading.sectionId}" 
                                placeholder="e.g., MH05 to MH06"
                                onchange="window.updatePipeLevelCheckReading(${index}, 'sectionId', this.value)"
                            >
                        </div>

                        <div class="mode-toggle">
                            <div class="mode-btn ${reading.slopeMode === 'percent' ? 'active' : ''}" onclick="window.togglePipeLevelCheckSlopeMode(${index}, 'percent')">Percentage (%)</div>
                            <div class="mode-btn ${reading.slopeMode === 'ratio' ? 'active' : ''}" onclick="window.togglePipeLevelCheckSlopeMode(${index}, 'ratio')">Ratio (1 in X)</div>
                        </div>

                        ${reading.slopeMode === 'percent' ? `
                        <div class="form-group">
                            <label><i class="fas fa-percentage label-icon"></i>Slope (%)</label>
                            <input 
                                type="number" 
                                value="${reading.slopeValue !== null ? reading.slopeValue : ''}" 
                                placeholder="e.g., 1.111"
                                step="0.001"
                                onchange="window.updatePipeLevelCheckReading(${index}, 'slopeValue', this.value)"
                            >
                            ${converterHtml}
                        </div>
                        ` : `
                        <div class="form-group">
                            <label><i class="fas fa-divide label-icon"></i>Slope (1 in X)</label>
                            <input 
                                type="number" 
                                value="${reading.slopeValue !== null ? reading.slopeValue : ''}" 
                                placeholder="e.g., 90"
                                step="0.001"
                                onchange="window.updatePipeLevelCheckReading(${index}, 'slopeValue', this.value)"
                            >
                            ${converterHtml}
                        </div>
                        `}
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-ruler-horizontal label-icon"></i>Distance (m)</label>
                                <input 
                                    type="number" 
                                    value="${reading.distance !== null ? reading.distance : ''}" 
                                    placeholder="e.g., 25.00"
                                    step="0.001"
                                    onchange="window.updatePipeLevelCheckReading(${index}, 'distance', this.value)"
                                >
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-arrow-up label-icon"></i>Start Height (m)</label>
                                <input 
                                    type="number" 
                                    value="${reading.startHeight !== null ? reading.startHeight : ''}" 
                                    placeholder="e.g., 179.250"
                                    step="0.001"
                                    onchange="window.updatePipeLevelCheckReading(${index}, 'startHeight', this.value)"
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-tape label-icon"></i>Measured Height (m)</label>
                            <input 
                                type="number" 
                                value="${reading.measuredHeight !== null ? reading.measuredHeight : ''}" 
                                placeholder="e.g., 179.730"
                                step="0.001"
                                onchange="window.updatePipeLevelCheckReading(${index}, 'measuredHeight', this.value)"
                            >
                        </div>
                        
                        ${resultHtml}
                        
                        <div class="extra-distance-section hidden" id="extraDistanceSection-${reading.id}">
                            <div class="form-group">
                                <label><i class="fas fa-ruler-combined label-icon"></i>Extra Distance (m)</label>
                                <input 
                                    type="number" 
                                    id="extraDistance-${reading.id}"
                                    placeholder="e.g., 5.00"
                                    step="0.001"
                                >
                                <button class="btn btn-warning" style="margin-top: 10px; width: 100%;" onclick="window.updatePipeLevelCheckWithExtra(${index})">
                                    <i class="fas fa-sync"></i> Update with Extra Distance
                                </button>
                            </div>
                        </div>
                        
                        <button class="btn btn-info" style="width: 100%; margin-top: 10px;" onclick="window.toggleExtraDistanceSection(${reading.id})">
                            <i class="fas fa-plus-circle"></i> Add Extra Distance
                        </button>
                        
                        <div class="form-group">
                            <label><i class="fas fa-sticky-note label-icon"></i>Notes (Optional)</label>
                            <textarea 
                                placeholder="e.g., Measurement notes..."
                                onchange="window.updatePipeLevelCheckReading(${index}, 'notes', this.value)">${reading.notes}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Clear all pipe level check data
 */
export function clearPipeLevelCheckToolData() {
    if (appState.pipeLevelCheck.readings.length === 0) {
        showNotification('No pipe level data to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all pipe level check data? This cannot be undone.')) return;
    
    appState.pipeLevelCheck.readings = [];
    appState.pipeLevelCheck.readingCounter = 0;
    
    addPipeLevelCheckReading(); // Add one empty reading back
    updateUnifiedPreview();
    showNotification('Pipe level data cleared');
}
