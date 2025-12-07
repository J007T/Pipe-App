/**
 * PurposeMobile Field Tools - State Management
 * Centralized application state for all tools
 */

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
