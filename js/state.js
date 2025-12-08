/**
 * PurposeMobile Field Tools - State Management
 * Centralized application state for all tools
 */

// localStorage keys and auto-save timeout
const STATE_KEY = 'purposemobile-app-state-v1';
let saveTimeout = null;

export const appState = {
    // Pipe Level Check Tool
    pipeLevelCheck: {
        readings: [],
        readingCounter: 0
    },
    
    // Laser Converter Tool
    laser: {
        readings: [],
        readingCounter: 0
    },
    
    // Regrade Tool
    regrade: {
        readings: [],
        readingCounter: 0
    },
    
    // Grade Check Tool
    gradeCheck: {
        readings: [],
        readingCounter: 0
    },
    
    // Chainage IL Tool
    chainageIL: {
        readings: [],
        readingCounter: 0
    },
    
    // General Notes
    generalNotes: {
        notes: [],
        noteCounter: 0
    },
    
    // Manual preview edit flag
    manualPreviewEdit: false
};

/**
 * Reset all tool data to initial state
 */
export function resetAllState() {
    appState.pipeLevelCheck = { readings: [], readingCounter: 0 };
    appState.laser = { readings: [], readingCounter: 0 };
    appState.regrade = { readings: [], readingCounter: 0 };
    appState.gradeCheck = { readings: [], readingCounter: 0 };
    appState.chainageIL = { readings: [], readingCounter: 0 };
    appState.generalNotes = { notes: [], noteCounter: 0 };
    appState.manualPreviewEdit = false;
}

/**
 * Reset specific tool state
 */
export function resetToolState(toolName) {
    if (appState[toolName]) {
        if (toolName === 'generalNotes') {
            appState[toolName] = { notes: [], noteCounter: 0 };
        } else {
            appState[toolName] = { readings: [], readingCounter: 0 };
        }
    }
}

/**
 * Auto-save state to localStorage (debounced)
 * Works alongside Firebase - saves work-in-progress
 */
export function autoSaveState() {
    // Clear any existing timeout
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    // Set new timeout for 1 second debounce
    saveTimeout = setTimeout(() => {
        try {
            // Don't save manualPreviewEdit flag
            const stateToSave = { ...appState };
            delete stateToSave.manualPreviewEdit;
            
            localStorage.setItem(STATE_KEY, JSON.stringify(stateToSave));
            console.log('✅ Work-in-progress auto-saved');
        } catch (e) {
            console.error('Auto-save failed:', e);
            if (e.name === 'QuotaExceededError') {
                // If storage full, just log it - Firebase is the backup
                console.warn('⚠️ localStorage full - relying on Firebase');
            }
        }
    }, 1000); // 1 second debounce
}

/**
 * Load saved state from localStorage
 * Restores work-in-progress on page load
 */
export function loadSavedState() {
    try {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(key => {
                if (key !== 'manualPreviewEdit') {
                    appState[key] = parsed[key];
                }
            });
            console.log('✅ Work-in-progress restored from localStorage');
            return true;
        }
    } catch (e) {
        console.error('Load state failed:', e);
        // Clear corrupted state
        localStorage.removeItem(STATE_KEY);
    }
    return false;
}

/**
 * Clear work-in-progress (doesn't affect Firebase saved reports)
 */
export function clearLocalState() {
    localStorage.removeItem(STATE_KEY);
    console.log('✅ Work-in-progress cleared');
}
