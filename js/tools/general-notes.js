/**
 * PurposeMobile Field Tools - General Notes Tool
 * Documents field observations and conditions
 */

import { appState, autoSaveState } from '../state.js';
import { showNotification } from '../ui.js';
import { updateUnifiedPreview } from '../message-generator.js';

/**
 * Add new general note
 */
export function addGeneralNote() {
    appState.generalNotes.noteCounter++;
    const note = {
        id: appState.generalNotes.noteCounter,
        content: ''
    };
    
    appState.generalNotes.notes.push(note);
    renderGeneralNotes();
    updateUnifiedPreview();
    showNotification('Note added');
    autoSaveState();
}

/**
 * Delete general note
 */
export function deleteGeneralNote(id) {
    if (appState.generalNotes.notes.length === 1) {
        showNotification('Must keep at least one note', 'error');
        return;
    }
    
    appState.generalNotes.notes = appState.generalNotes.notes.filter(n => n.id !== id);
    renderGeneralNotes();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Note deleted');
    autoSaveState();
}

/**
 * Move note up in order
 */
export function moveGeneralNoteUp(index) {
    if (index === 0) return;
    [appState.generalNotes.notes[index - 1], appState.generalNotes.notes[index]] = 
    [appState.generalNotes.notes[index], appState.generalNotes.notes[index - 1]];
    renderGeneralNotes();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Note moved up');
    autoSaveState();
}

/**
 * Move note down in order
 */
export function moveGeneralNoteDown(index) {
    if (index === appState.generalNotes.notes.length - 1) return;
    [appState.generalNotes.notes[index], appState.generalNotes.notes[index + 1]] = 
    [appState.generalNotes.notes[index + 1], appState.generalNotes.notes[index]];
    renderGeneralNotes();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    showNotification('Note moved down');
    autoSaveState();
}

/**
 * Update general note content
 */
export function updateGeneralNote(index, content) {
    const note = appState.generalNotes.notes[index];
    if (!note) return;
    
    note.content = content.trim();
    renderGeneralNotes();
    appState.manualPreviewEdit = false;
    updateUnifiedPreview();
    autoSaveState();
}

/**
 * Render all general notes
 */
export function renderGeneralNotes() {
    const container = document.getElementById('generalNotesContainer');
    
    if (appState.generalNotes.notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes yet</p><p class="small">Click "Add Note" to begin</p></div>';
        return;
    }
    
    container.innerHTML = appState.generalNotes.notes.map((note, index) => {
        const hasContent = note.content && note.content.trim() !== '';
        
        return `
            <div class="reading-card" id="generalNote-${note.id}">
                <div class="reading-card-header" onclick="window.toggleReadingCard('generalNote-${note.id}')">
                    <div class="reading-number">
                        <i class="fas fa-sticky-note"></i>
                        Note ${index + 1}${hasContent ? ' • ' + (note.content.length > 20 ? note.content.substring(0, 20) + '...' : note.content) : ''}
                    </div>
                    <div class="reading-controls">
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveGeneralNoteUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="control-btn" onclick="event.stopPropagation(); window.moveGeneralNoteDown(${index})" ${index === appState.generalNotes.notes.length - 1 ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="control-btn delete-btn" onclick="event.stopPropagation(); window.deleteGeneralNote(${note.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="reading-card-content">
                    <div style="padding: 18px;">
                        <div class="form-group">
                            <label><i class="fas fa-edit label-icon"></i>Note Content</label>
                            <textarea 
                                placeholder="Enter your note here..."
                                oninput="window.updateGeneralNote(${index}, this.value)"
                                rows="4"
                                style="min-height: 120px;"
                            >${note.content || ''}</textarea>
                        </div>
                        
                        ${hasContent ? `
                            <div class="result-display">
                                <div class="result-label">Preview</div>
                                <div class="result-detail">${sanitizeNoteContent(note.content)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Clear all general notes
 */
export function clearGeneralNotesData() {
    if (appState.generalNotes.notes.length === 0) {
        showNotification('No notes to clear', 'warning');
        return;
    }
    
    if (!confirm('Clear all notes? This cannot be undone.')) return;
    
    appState.generalNotes.notes = [];
    appState.generalNotes.noteCounter = 0;
    
    addGeneralNote(); // Add one empty note back
    updateUnifiedPreview();
    showNotification('All notes cleared');
    autoSaveState();
}

/**
 * Sanitize note content to prevent XSS
 */
function sanitizeNoteContent(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/\n/g, '<br>');
}
