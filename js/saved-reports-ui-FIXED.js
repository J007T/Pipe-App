/**
 * Saved Reports UI Module
 * Handles viewing, editing, copying, and deleting saved reports
 * IMPROVED VERSION with better authentication and error handling
 */

import { loadUserReports, loadReport, deleteReport, restoreReportToApp } from './database.js';
import { appState } from './state.js';
import { showNotification } from './ui.js';
import { updateUnifiedPreview } from './message-generator.js';
import { renderPipeLevelCheckReadings } from './tools/pipe-level-check.js';
import { renderLaserReadings } from './tools/laser-converter.js';
import { renderRegradeReadings } from './tools/regrade.js';
import { renderGradeCheckReadings } from './tools/grade-check.js';
import { renderChainageILReadings } from './tools/chainage-il.js';
import { renderGeneralNotes } from './tools/general-notes.js';

let allReports = [];
let currentFilter = 'all';
let currentSearch = '';

/**
 * Initialize saved reports module
 */
export function initSavedReports() {
    console.log('[OK] Saved Reports module initialized');
    
    // Add event listeners
    const searchInput = document.getElementById('reportSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Add filter button listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
}

/**
 * Refresh and display saved reports
 * IMPROVED: Better authentication and error handling
 */
export async function refreshSavedReports() {
    console.log('[DEBUG] refreshSavedReports called');
    
    const container = document.getElementById('savedReportsContainer');
    
    if (!container) {
        console.error('[ERROR] Saved reports container not found');
        return;
    }
    
    // CRITICAL FIX: Check if user is logged in BEFORE trying to load
    const isLoggedIn = window._firebaseAuth && window._firebaseAuth.currentUser;
    console.log('[DEBUG] User logged in:', isLoggedIn);
    console.log('[DEBUG] Current user:', window._firebaseAuth?.currentUser?.email || 'None');
    
    if (!isLoggedIn) {
        console.log('[INFO] User not logged in, showing login prompt');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Please login to view saved reports</p>
                <button class="btn btn-primary" onclick="window.showAuthModal('login')" style="margin-top: 16px; padding: 12px 24px; font-size: 1rem;">
                    <i class="fas fa-sign-in-alt"></i> Login Now
                </button>
            </div>
        `;
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading saved reports...</p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">This may take a few seconds</p>
        </div>
    `;
    
    try {
        console.log('[DEBUG] Starting to load reports from Firebase...');
        
        // Load reports from Firebase
        allReports = await loadUserReports();
        
        console.log('[OK] Loaded reports:', allReports.length);
        console.log('[DEBUG] Reports:', allReports);
        
        // Apply current filters and render
        renderReportsList();
        
    } catch (error) {
        console.error('[ERROR] Error loading reports:', error);
        console.error('[ERROR] Error code:', error.code);
        console.error('[ERROR] Error message:', error.message);
        console.error('[ERROR] Full error:', error);
        
        // Determine user-friendly error message based on error type
        let errorTitle = 'Error loading reports';
        let errorDescription = 'Please try again or contact support';
        let troubleshootingHTML = '';
        
        if (error.code === 'failed-precondition') {
            errorTitle = 'Database Configuration Required';
            errorDescription = 'A database index needs to be created';
            troubleshootingHTML = `
                <div style="background: var(--bg-input); border: 2px solid var(--warning); border-radius: 8px; padding: 16px; margin-top: 16px; text-align: left;">
                    <p style="font-weight: 600; margin-bottom: 8px; color: var(--warning);">
                        <i class="fas fa-tools"></i> Administrator Action Required
                    </p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
                        This app needs a Firestore composite index. Please follow these steps:
                    </p>
                    <ol style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 20px;">
                        <li>Go to Firebase Console</li>
                        <li>Navigate to Firestore Database → Indexes</li>
                        <li>Click "Create Index"</li>
                        <li>Collection: <code>reports</code></li>
                        <li>Field: <code>userId</code> (Ascending)</li>
                        <li>Field: <code>updatedAt</code> (Descending)</li>
                        <li>Click "Create" and wait 2-5 minutes</li>
                    </ol>
                </div>
            `;
        } else if (error.code === 'permission-denied') {
            errorTitle = 'Permission Denied';
            errorDescription = 'You do not have permission to access saved reports';
            troubleshootingHTML = `
                <div style="background: var(--bg-input); border: 2px solid var(--danger); border-radius: 8px; padding: 16px; margin-top: 16px;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
                        Try these steps:
                    </p>
                    <ul style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 20px;">
                        <li>Log out and log back in</li>
                        <li>Check that you're using the correct account</li>
                        <li>Contact the administrator if the issue persists</li>
                    </ul>
                </div>
            `;
        } else if (error.code === 'unavailable') {
            errorTitle = 'Connection Error';
            errorDescription = 'Unable to connect to the database';
            troubleshootingHTML = `
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px;">
                    Check your internet connection and try again
                </p>
            `;
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>
                <p style="font-weight: 700; font-size: 1.1rem;">${errorTitle}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 8px;">${errorDescription}</p>
                ${troubleshootingHTML}
                <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="window.refreshSavedReports()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                    <button class="btn btn-primary" onclick="window.showAuthModal('login')">
                        <i class="fas fa-sign-in-alt"></i> Re-login
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Handle search input
 */
function handleSearch(event) {
    currentSearch = event.target.value.toLowerCase().trim();
    console.log('[DEBUG] Search filter:', currentSearch);
    renderReportsList();
}

/**
 * Handle filter button click
 */
function handleFilterClick(event) {
    const btn = event.currentTarget;
    const filter = btn.dataset.filter;
    
    console.log('[DEBUG] Filter changed to:', filter);
    
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.borderColor = 'var(--border)';
        b.style.color = 'var(--text-primary)';
    });
    
    btn.classList.add('active');
    btn.style.background = 'var(--primary)';
    btn.style.borderColor = 'var(--primary)';
    btn.style.color = 'white';
    
    currentFilter = filter;
    renderReportsList();
}

/**
 * Filter reports based on current filter and search
 */
function filterReports(reports) {
    let filtered = [...reports];
    
    // Apply date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (currentFilter === 'today') {
        filtered = filtered.filter(r => new Date(r.updatedAt) >= todayStart);
    } else if (currentFilter === 'week') {
        filtered = filtered.filter(r => new Date(r.updatedAt) >= weekStart);
    } else if (currentFilter === 'month') {
        filtered = filtered.filter(r => new Date(r.updatedAt) >= monthStart);
    }
    
    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(r => {
            const projectName = (r.projectName || '').toLowerCase();
            const stage = (r.stage || '').toLowerCase();
            return projectName.includes(currentSearch) || stage.includes(currentSearch);
        });
    }
    
    console.log('[DEBUG] Filtered reports:', filtered.length, 'of', reports.length);
    return filtered;
}

/**
 * Render the reports list
 */
function renderReportsList() {
    const container = document.getElementById('savedReportsContainer');
    const filtered = filterReports(allReports);
    
    console.log('[DEBUG] Rendering', filtered.length, 'reports');
    
    if (filtered.length === 0) {
        if (currentSearch || currentFilter !== 'all') {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No reports found</p>
                    <p style="font-size: 0.85rem; opacity: 0.7;">Try adjusting your search or filters</p>
                    <button class="btn btn-secondary" onclick="window.clearReportsFilters()" style="margin-top: 16px;">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No saved reports yet</p>
                    <p style="font-size: 0.85rem; opacity: 0.7;">Start by creating calculations and clicking "Save Report"</p>
                </div>
            `;
        }
        return;
    }
    
    // Render report cards
    container.innerHTML = filtered.map(report => createReportCard(report)).join('');
}

/**
 * Clear all filters
 */
export function clearReportsFilters() {
    currentSearch = '';
    currentFilter = 'all';
    
    const searchInput = document.getElementById('reportSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-primary)';
        
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = 'white';
        }
    });
    
    renderReportsList();
    showNotification('Filters cleared');
}

/**
 * Create a report card HTML
 */
function createReportCard(report) {
    const date = new Date(report.updatedAt);
    const formattedDate = formatDate(date);
    const timeAgo = getTimeAgo(date);
    
    // Count tools used
    const toolCounts = [];
    if (report.pipeLevelCheck?.readings?.length > 0) {
        toolCounts.push(`${report.pipeLevelCheck.readings.length} Pipe`);
    }
    if (report.laser?.readings?.length > 0) {
        toolCounts.push(`${report.laser.readings.length} Laser`);
    }
    if (report.regrade?.readings?.length > 0) {
        toolCounts.push(`${report.regrade.readings.length} Regrade`);
    }
    if (report.gradeCheck?.readings?.length > 0) {
        toolCounts.push(`${report.gradeCheck.readings.length} Grade Check`);
    }
    if (report.chainageIL?.readings?.length > 0) {
        toolCounts.push(`${report.chainageIL.readings.length} Chainage`);
    }
    if (report.generalNotes?.notes?.length > 0) {
        toolCounts.push(`${report.generalNotes.notes.length} Notes`);
    }
    
    const toolSummary = toolCounts.length > 0 ? toolCounts.join(' • ') : 'Empty report';
    
    return `
        <div class="report-card" style="background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: var(--shadow-light); transition: var(--transition);">
            <div style="padding: 16px; border-bottom: 1px solid var(--border-light);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 1.05rem; color: var(--primary); font-weight: 700;">
                        <i class="fas fa-file-alt" style="margin-right: 8px; color: var(--primary);"></i>
                        ${escapeHtml(report.projectName || 'Untitled')} ${escapeHtml(report.stage || '')}
                    </h3>
                </div>
                
                <div style="display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">
                    <span><i class="fas fa-clock" style="margin-right: 4px;"></i>${timeAgo}</span>
                    <span><i class="fas fa-calendar" style="margin-right: 4px;"></i>${formattedDate}</span>
                </div>
                
                <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">
                    <i class="fas fa-layer-group" style="margin-right: 6px; color: var(--secondary);"></i>
                    ${toolSummary}
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--border-light);">
                <button onclick="window.viewReport('${report.id}')" style="padding: 14px; border: none; background: transparent; color: var(--primary); cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: var(--transition-fast); border-right: 1px solid var(--border-light);">
                    <i class="fas fa-eye" style="display: block; font-size: 1.2rem; margin-bottom: 4px;"></i>
                    View
                </button>
                <button onclick="window.editReport('${report.id}')" style="padding: 14px; border: none; background: transparent; color: var(--secondary); cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: var(--transition-fast); border-right: 1px solid var(--border-light);">
                    <i class="fas fa-edit" style="display: block; font-size: 1.2rem; margin-bottom: 4px;"></i>
                    Edit
                </button>
                <button onclick="window.copyReportMessage('${report.id}')" style="padding: 14px; border: none; background: transparent; color: var(--info); cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: var(--transition-fast); border-right: 1px solid var(--border-light);">
                    <i class="fas fa-copy" style="display: block; font-size: 1.2rem; margin-bottom: 4px;"></i>
                    Copy
                </button>
                <button onclick="window.deleteReportConfirm('${report.id}')" style="padding: 14px; border: none; background: transparent; color: var(--danger); cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: var(--transition-fast);">
                    <i class="fas fa-trash" style="display: block; font-size: 1.2rem; margin-bottom: 4px;"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
}

// [REST OF THE FILE REMAINS THE SAME - including viewReport, editReport, copyReportMessage, 
// deleteReportConfirm, generateReportPreview, showReportModal, closeReportModal, 
// formatDate, getTimeAgo, switchTab, escapeHtml functions]

/**
 * View report in modal
 */
export async function viewReport(reportId) {
    try {
        const report = await loadReport(reportId);
        if (!report) return;
        
        // Generate message preview
        const message = generateReportPreview(report);
        
        // Show modal with report
        showReportModal(report, message, 'view');
        
    } catch (error) {
        console.error('[ERROR] Error viewing report:', error);
        showNotification('Error loading report', 'error');
    }
}

/**
 * Edit report (load into app)
 */
export async function editReport(reportId) {
    if (!confirm('Load this report for editing? This will replace your current work.')) {
        return;
    }
    
    try {
        const report = await loadReport(reportId);
        if (!report) return;
        
        // Restore data to app
        restoreReportToApp(report, appState);
        
        // Re-render all tools
        renderPipeLevelCheckReadings();
        renderLaserReadings();
        renderRegradeReadings();
        renderGradeCheckReadings();
        renderChainageILReadings();
        renderGeneralNotes();
        
        // Update preview
        updateUnifiedPreview();
        
        // Switch to first tab
        switchTab('pipelevelcheck');
        
        showNotification('Report loaded for editing!');
        
    } catch (error) {
        console.error('[ERROR] Error editing report:', error);
        showNotification('Error loading report', 'error');
    }
}

/**
 * Copy report message to clipboard
 */
export async function copyReportMessage(reportId) {
    try {
        const report = await loadReport(reportId);
        if (!report) return;
        
        // Generate message
        const message = generateReportPreview(report);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(message);
        
        showNotification('Report message copied to clipboard!');
        
    } catch (error) {
        console.error('[ERROR] Error copying report:', error);
        showNotification('Error copying message', 'error');
    }
}

/**
 * Delete report with confirmation
 */
export async function deleteReportConfirm(reportId) {
    const report = allReports.find(r => r.id === reportId);
    const reportName = report ? `${report.projectName || 'Untitled'} ${report.stage || ''}` : 'this report';
    
    if (!confirm(`Delete "${reportName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const success = await deleteReport(reportId);
        
        if (success) {
            // Remove from local list
            allReports = allReports.filter(r => r.id !== reportId);
            
            // Re-render
            renderReportsList();
            
            showNotification('Report deleted');
        }
        
    } catch (error) {
        console.error('[ERROR] Error deleting report:', error);
        showNotification('Error deleting report', 'error');
    }
}

/**
 * Generate report message preview (simplified)
 */
function generateReportPreview(report) {
    let message = '';
    
    // Project Header
    if (report.projectName && report.stage) {
        message += `${report.projectName} ${report.stage}\n\n`;
    }
    
    // For now, just show a simple preview
    // Full implementation would include all tools
    if (report.pipeLevelCheck?.readings?.length > 0) {
        message += `PIPE LEVEL CHECKS: ${report.pipeLevelCheck.readings.length} readings\n`;
    }
    
    if (report.generalNotes?.notes?.length > 0) {
        message += '\nGENERAL NOTES\n\n';
        report.generalNotes.notes.filter(n => n.content).forEach(note => {
            message += `${note.content.trim()}\n\n`;
        });
    }
    
    return message || 'Empty report';
}

/**
 * Show report modal
 */
function showReportModal(report, message, mode) {
    const modal = document.createElement('div');
    modal.id = 'reportViewModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 12px; max-width: 428px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 1.2rem;">
                    ${escapeHtml(report.projectName || 'Untitled')} ${escapeHtml(report.stage || '')}
                </h2>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.85rem;">
                    Saved: ${formatDate(new Date(report.updatedAt))}
                </p>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 20px;">
                <textarea readonly style="width: 100%; min-height: 400px; padding: 14px; border: 2px solid var(--border); border-radius: 8px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.85rem; line-height: 1.6; background: var(--bg-input); color: var(--text-primary); resize: vertical;">${message}</textarea>
            </div>
            
            <div style="padding: 16px; border-top: 1px solid var(--border); display: flex; gap: 10px;">
                <button onclick="window.copyReportMessage('${report.id}'); window.closeReportModal();" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-copy"></i> Copy Message
                </button>
                <button onclick="window.closeReportModal()" class="btn btn-secondary" style="flex: 1;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeReportModal();
        }
    });
}

/**
 * Close report modal
 */
export function closeReportModal() {
    const modal = document.getElementById('reportViewModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Format date for display
 */
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

/**
 * Switch tab helper
 */
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions
export const savedReportsFunctions = {
    initSavedReports,
    refreshSavedReports,
    viewReport,
    editReport,
    copyReportMessage,
    deleteReportConfirm,
    closeReportModal,
    clearReportsFilters
};

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.refreshSavedReports = refreshSavedReports;
    window.viewReport = viewReport;
    window.editReport = editReport;
    window.copyReportMessage = copyReportMessage;
    window.deleteReportConfirm = deleteReportConfirm;
    window.closeReportModal = closeReportModal;
    window.clearReportsFilters = clearReportsFilters;
}
