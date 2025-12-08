/**
 * Saved Reports UI Module
 * Handles viewing, editing, copying, and deleting saved reports
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
    console.log('âœ… Saved Reports module initialized');
    
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
 */
export async function refreshSavedReports() {
    const container = document.getElementById('savedReportsContainer');
    
    if (!container) {
        console.error('Saved reports container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading saved reports...</p>
        </div>
    `;
    
    try {
        // Load reports from Firebase
        allReports = await loadUserReports();
        
        console.log('Loaded reports:', allReports.length);
        
        // Apply current filters and render
        renderReportsList();
        
    } catch (error) {
        console.error('Error loading reports:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading reports</p>
                <p style="font-size: 0.85rem; opacity: 0.7;">Please try again</p>
            </div>
        `;
    }
}

/**
 * Handle search input
 */
function handleSearch(event) {
    currentSearch = event.target.value.toLowerCase().trim();
    renderReportsList();
}

/**
 * Handle filter button click
 */
function handleFilterClick(event) {
    const btn = event.currentTarget;
    const filter = btn.dataset.filter;
    
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
    
    return filtered;
}

/**
 * Render the reports list
 */
function renderReportsList() {
    const container = document.getElementById('savedReportsContainer');
    const filtered = filterReports(allReports);
    
    if (filtered.length === 0) {
        if (currentSearch || currentFilter !== 'all') {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No reports found</p>
                    <p style="font-size: 0.85rem; opacity: 0.7;">Try adjusting your search or filters</p>
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
    
    const toolSummary = toolCounts.length > 0 ? toolCounts.join(' â€¢ ') : 'Empty report';
    
    return `
        <div class="report-card" style="background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: var(--shadow-light); transition: var(--transition);">
            <div style="padding: 16px; border-bottom: 1px solid var(--border-light);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 1.05rem; color: var(--primary); font-weight: 700;">
                        <i class="fas fa-file-alt" style="margin-right: 8px; color: var(--primary);"></i>
                        ${report.projectName || 'Untitled'} ${report.stage || ''}
                    </h3>
                    <button class="control-btn" onclick="window.toggleReportMenu('${report.id}')" style="background: transparent; border: 1px solid var(--border);">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
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
        console.error('Error viewing report:', error);
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
        console.error('Error editing report:', error);
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
        console.error('Error copying report:', error);
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
        console.error('Error deleting report:', error);
        showNotification('Error deleting report', 'error');
    }
}

/**
 * Generate report message preview
 */
function generateReportPreview(report) {
    // This uses the same logic as updateUnifiedPreview but with report data
    let message = '';
    
    // Project Header
    if (report.projectName && report.stage) {
        message += `${report.projectName} ${report.stage}\n\n`;
    }
    
    // Pipe Level Checks
    if (report.pipeLevelCheck?.readings?.length > 0) {
        message += 'PIPE LEVEL CHECKS\n\n';
        report.pipeLevelCheck.readings.filter(r => r.calculated).forEach(reading => {
            if (reading.sectionId) {
                message += `${reading.sectionId}\n\n`;
            }
            
            const extraTotal = reading.extraDistances ? 
                reading.extraDistances.reduce((sum, ed) => sum + ed.distance, 0) : 0;
            const totalChainage = reading.distance + extraTotal;
            
            message += `CH: ${totalChainage.toFixed(2)}\n`;
            message += `DES: ${reading.results.designHeight.toFixed(3)}\n`;
            message += `AS CON: ${reading.measuredHeight.toFixed(3)}\n`;
            
            const status = reading.results.status.split(' ')[0].toUpperCase();
            const difference = reading.results.difference;
            
            if (status === 'HIGH') {
                message += `${status}: +${Math.abs(difference).toFixed(3)}\n\n`;
            } else if (status === 'LOW') {
                message += `${status}: -${Math.abs(difference).toFixed(3)}\n\n`;
            } else {
                message += `${status}: ${difference.toFixed(3)}\n\n`;
            }
            
            if (reading.notes) {
                message += `- ${reading.notes}\n\n`;
            }
        });
        message += '\n';
    }
    
    // Add other tools... (abbreviated for space)
    
    // General Notes
    if (report.generalNotes?.notes?.length > 0) {
        const notes = report.generalNotes.notes.filter(n => n.content && n.content.trim());
        if (notes.length > 0) {
            message += 'GENERAL NOTES\n\n';
            notes.forEach((note, index) => {
                if (note.content.trim()) {
                    message += note.content.trim();
                    if (index < notes.length - 1) {
                        message += '\n\n';
                    }
                }
            });
        }
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
                    ${report.projectName || 'Untitled'} ${report.stage || ''}
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

// Export functions
export const savedReportsFunctions = {
    initSavedReports,
    refreshSavedReports,
    viewReport,
    editReport,
    copyReportMessage,
    deleteReportConfirm,
    closeReportModal
};

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.refreshSavedReports = refreshSavedReports;
    window.viewReport = viewReport;
    window.editReport = editReport;
    window.copyReportMessage = copyReportMessage;
    window.deleteReportConfirm = deleteReportConfirm;
    window.closeReportModal = closeReportModal;
}
