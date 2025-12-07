/**
 * PurposeMobile Field Tools - Application Entry Point
 * Initializes all modules and sets up event listeners
 */

// Import state management
import { appState, resetAllState, resetToolState } from './state.js';

// Import UI utilities
import { 
    loadTheme, 
    toggleTheme, 
    switchTab, 
    toggleSection, 
    toggleReferenceTable, 
    toggleReadingCard,
    showNotification,
    handleUnifiedPreviewEdit,
    copyUnifiedMessage
} from './ui.js';

// Import message generator
import { updateUnifiedPreview } from './message-generator.js';

// Import all tool modules
import * as PipeLevelCheck from './tools/pipe-level-check.js';
import * as LaserConverter from './tools/laser-converter.js';
import * as Regrade from './tools/regrade.js';
import * as GradeCheck from './tools/grade-check.js';
import * as ChainageIL from './tools/chainage-il.js';
import * as GeneralNotes from './tools/general-notes.js';

// Import saved reports UI
import { initSavedReports, refreshSavedReports } from './saved-reports-ui.js';

/**
 * Expose functions to global window object
 * Required for inline onclick handlers in HTML
 */
function exposeToWindow() {
    // Expose appState globally for Firebase
    window.appState = appState;
    
    // UI Functions
    window.toggleTheme = toggleTheme;
    window.switchTab = switchTab;
    window.toggleSection = toggleSection;
    window.toggleReferenceTable = toggleReferenceTable;
    window.toggleReadingCard = toggleReadingCard;
    window.handleUnifiedPreviewEdit = handleUnifiedPreviewEdit;
    window.copyUnifiedMessage = copyUnifiedMessage;
    
    // Pipe Level Check
    window.addPipeLevelCheckReading = PipeLevelCheck.addPipeLevelCheckReading;
    window.deletePipeLevelCheckReading = PipeLevelCheck.deletePipeLevelCheckReading;
    window.movePipeLevelCheckReadingUp = PipeLevelCheck.movePipeLevelCheckReadingUp;
    window.movePipeLevelCheckReadingDown = PipeLevelCheck.movePipeLevelCheckReadingDown;
    window.updatePipeLevelCheckReading = PipeLevelCheck.updatePipeLevelCheckReading;
    window.togglePipeLevelCheckSlopeMode = PipeLevelCheck.togglePipeLevelCheckSlopeMode;
    window.calculatePipeLevelCheckReading = PipeLevelCheck.calculatePipeLevelCheckReading;
    window.updatePipeLevelCheckWithExtra = PipeLevelCheck.updatePipeLevelCheckWithExtra;
    window.toggleExtraDistanceSection = PipeLevelCheck.toggleExtraDistanceSection;
    window.clearPipeLevelCheckToolData = PipeLevelCheck.clearPipeLevelCheckToolData;
    
    // Laser Converter
    window.addLaserReading = LaserConverter.addLaserReading;
    window.deleteLaserReading = LaserConverter.deleteLaserReading;
    window.moveLaserReadingUp = LaserConverter.moveLaserReadingUp;
    window.moveLaserReadingDown = LaserConverter.moveLaserReadingDown;
    window.updateLaserReading = LaserConverter.updateLaserReading;
    window.clearLaserToolData = LaserConverter.clearLaserToolData;
    
    // Regrade
    window.addRegradeReading = Regrade.addRegradeReading;
    window.deleteRegradeReading = Regrade.deleteRegradeReading;
    window.moveRegradeReadingUp = Regrade.moveRegradeReadingUp;
    window.moveRegradeReadingDown = Regrade.moveRegradeReadingDown;
    window.updateRegradeReading = Regrade.updateRegradeReading;
    window.toggleRegradeReadingGradeMode = Regrade.toggleRegradeReadingGradeMode;
    window.calculateRegradeReading = Regrade.calculateRegradeReading;
    window.clearRegradeToolData = Regrade.clearRegradeToolData;
    
    // Grade Check
    window.addGradeCheckReading = GradeCheck.addGradeCheckReading;
    window.removeGradeCheckReading = GradeCheck.removeGradeCheckReading;
    window.moveGradeCheckReadingUp = GradeCheck.moveGradeCheckReadingUp;
    window.moveGradeCheckReadingDown = GradeCheck.moveGradeCheckReadingDown;
    window.updateGradeCheckReading = GradeCheck.updateGradeCheckReading;
    window.toggleGradeCheckGradeMode = GradeCheck.toggleGradeCheckGradeMode;
    window.clearGradeCheckToolData = GradeCheck.clearGradeCheckToolData;
    
    // Chainage IL
    window.addChainageILReading = ChainageIL.addChainageILReading;
    window.deleteChainageILReading = ChainageIL.deleteChainageILReading;
    window.moveChainageILReadingUp = ChainageIL.moveChainageILReadingUp;
    window.moveChainageILReadingDown = ChainageIL.moveChainageILReadingDown;
    window.updateChainageILReading = ChainageIL.updateChainageILReading;
    window.toggleChainageILGradeMode = ChainageIL.toggleChainageILGradeMode;
    window.clearChainageILToolData = ChainageIL.clearChainageILToolData;
    
    // General Notes
    window.addGeneralNote = GeneralNotes.addGeneralNote;
    window.deleteGeneralNote = GeneralNotes.deleteGeneralNote;
    window.moveGeneralNoteUp = GeneralNotes.moveGeneralNoteUp;
    window.moveGeneralNoteDown = GeneralNotes.moveGeneralNoteDown;
    window.updateGeneralNote = GeneralNotes.updateGeneralNote;
    window.clearGeneralNotesData = GeneralNotes.clearGeneralNotesData;
    
    // Global clear function
    window.clearAllData = clearAllData;
}

/**
 * Clear all data from all tools
 */
function clearAllData() {
    if (!confirm('Clear ALL data from all tools? This action cannot be undone.')) return;
    
    // Clear project info
    document.getElementById('unifiedProjectName').value = '';
    document.getElementById('unifiedStage').value = '';
    
    // Reset all state
    resetAllState();
    
    // Reinitialize each tool with one reading
    PipeLevelCheck.addPipeLevelCheckReading();
    LaserConverter.addLaserReading();
    Regrade.addRegradeReading();
    GradeCheck.addGradeCheckReading();
    ChainageIL.addChainageILReading();
    GeneralNotes.addGeneralNote();
    
    updateUnifiedPreview();
    showNotification('All data cleared');
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.closest('.tab-btn').dataset.tab;
            if (tabName) {
                switchTab(tabName);
                
                // Load saved reports when switching to saved reports tab
                if (tabName === 'savedreports') {
                    refreshSavedReports();
                }
            }
        });
    });
    
    // Project info sync
    const projectNameInput = document.getElementById('unifiedProjectName');
    const stageInput = document.getElementById('unifiedStage');
    
    if (projectNameInput) {
        projectNameInput.addEventListener('input', updateUnifiedPreview);
    }
    if (stageInput) {
        stageInput.addEventListener('input', updateUnifiedPreview);
    }
    
    // Tool add buttons
    const addButtons = {
        'addPipeLevelCheckReadingBtn': PipeLevelCheck.addPipeLevelCheckReading,
        'addLaserReadingBtn': LaserConverter.addLaserReading,
        'addRegradeReadingBtn': Regrade.addRegradeReading,
        'addGradeCheckReadingBtn': GradeCheck.addGradeCheckReading,
        'addChainageILReadingBtn': ChainageIL.addChainageILReading,
        'addGeneralNoteBtn': GeneralNotes.addGeneralNote
    };
    
    Object.entries(addButtons).forEach(([btnId, handler]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    });
}

/**
 * Initialize all tools with one reading each
 */
function initializeTools() {
    PipeLevelCheck.addPipeLevelCheckReading();
    LaserConverter.addLaserReading();
    Regrade.addRegradeReading();
    GradeCheck.addGradeCheckReading();
    ChainageIL.addChainageILReading();
    GeneralNotes.addGeneralNote();
}

/**
 * Main application initialization
 */
function initializeApp() {
    // Load saved theme
    loadTheme();
    
    // Expose functions to window for onclick handlers
    exposeToWindow();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize saved reports UI
    initSavedReports();
    
    // Initialize each tool with one reading
    initializeTools();
    
    // Update unified preview
    updateUnifiedPreview();
    
    console.log('✅ PurposeMobile Field Tools - Ready!');
    console.log('📊 All 6 tools initialized');
    console.log('📁 Saved Reports module loaded');
    console.log('🎨 Theme system active');
    console.log('📱 Mobile-optimized interface loaded');
}

/**
 * Start the application
 * Wait for DOM to be fully loaded
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for testing purposes
export { initializeApp, clearAllData };
