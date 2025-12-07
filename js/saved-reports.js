/**
 * Saved Reports UI Module
 * Handles display and management of saved reports
 */

import { loadUserReports, loadReport, deleteReport } from './database.js';
import { isLoggedIn } from './auth.js';
import { showNotification } from './ui.js';

/**
 * Render saved reports list
 */
export async function renderSavedReports() {
  const container = document.getElementById('savedReportsContainer');
  
  if (!container) {
    console.error('Saved reports container not found');
    return;
  }
  
  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-lock"></i>
        <p>Please login to view saved reports</p>
      </div>
    `;
    return;
  }
  
  // Show loading state
  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading reports...</p>
    </div>
  `;
  
  try {
    const reports = await loadUserReports();
    
    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No saved reports yet</p>
          <p class="small">Save a report from any tool to see it here</p>
        </div>
      `;
      return;
    }
    
    // Render reports
    container.innerHTML = reports.map(report => `
      <div class="report-card" id="report-${report.id}">
        <div class="report-header">
          <div class="report-info">
            <h3 class="report-title">${escapeHtml(report.projectName)} ${escapeHtml(report.stage)}</h3>
            <p class="report-date">
              <i class="fas fa-clock"></i>
              ${formatDate(report.updatedAt)}
            </p>
          </div>
          <div class="report-actions">
            <button class="btn btn-primary btn-sm" onclick="window.loadReportById('${report.id}')">
              <i class="fas fa-download"></i> Load
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteReportById('${report.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="report-preview">
          ${getReportPreview(report)}
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error rendering saved reports:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading reports</p>
        <button class="btn btn-secondary" onclick="window.renderSavedReports()">
          <i class="fas fa-sync"></i> Retry
        </button>
      </div>
    `;
  }
}

/**
 * Load report into app
 */
export async function loadReportById(reportId) {
  try {
    const report = await loadReport(reportId);
    
    if (!report) return;
    
    // Load project info
    document.getElementById('unifiedProjectName').value = report.projectName || '';
    document.getElementById('unifiedStage').value = report.stage || '';
    
    // Load tool data into appState
    if (window.appState) {
      window.appState.pipeLevelCheck = report.pipeLevelCheck || { readings: [], readingCounter: 0 };
      window.appState.laser = report.laser || { readings: [], readingCounter: 0 };
      window.appState.regrade = report.regrade || { readings: [], readingCounter: 0 };
      window.appState.gradeCheck = report.gradeCheck || { readings: [], readingCounter: 0 };
      window.appState.chainageIL = report.chainageIL || { readings: [], readingCounter: 0 };
      window.appState.generalNotes = report.generalNotes || { notes: [], noteCounter: 0 };
    }
    
    // Re-render all tools
    if (window.renderPipeLevelCheckReadings) window.renderPipeLevelCheckReadings();
    if (window.renderLaserReadings) window.renderLaserReadings();
    if (window.renderRegradeReadings) window.renderRegradeReadings();
    if (window.renderGradeCheckReadings) window.renderGradeCheckReadings();
    if (window.renderChainageILReadings) window.renderChainageILReadings();
    if (window.renderGeneralNotes) window.renderGeneralNotes();
    
    // Update preview
    if (window.updateUnifiedPreview) window.updateUnifiedPreview();
    
    // Switch to first tool tab
    if (window.switchTab) window.switchTab('pipelevelcheck');
    
    showNotification('Report loaded successfully!');
    
  } catch (error) {
    console.error('Error loading report:', error);
    showNotification('Failed to load report', 'error');
  }
}

/**
 * Delete report with confirmation
 */
export async function deleteReportById(reportId) {
  if (!confirm('Delete this report? This cannot be undone.')) {
    return;
  }
  
  try {
    const success = await deleteReport(reportId);
    
    if (success) {
      // Remove from UI
      const card = document.getElementById(`report-${reportId}`);
      if (card) {
        card.remove();
      }
      
      // Re-render to check if empty
      renderSavedReports();
    }
  } catch (error) {
    console.error('Error deleting report:', error);
  }
}

/**
 * Get preview of report contents
 */
function getReportPreview(report) {
  const tools = [];
  
  if (report.pipeLevelCheck?.readings?.length > 0) {
    tools.push(`${report.pipeLevelCheck.readings.length} pipe level checks`);
  }
  if (report.laser?.readings?.length > 0) {
    tools.push(`${report.laser.readings.length} laser conversions`);
  }
  if (report.regrade?.readings?.length > 0) {
    tools.push(`${report.regrade.readings.length} regrade calculations`);
  }
  if (report.gradeCheck?.readings?.length > 0) {
    tools.push(`${report.gradeCheck.readings.length} grade checks`);
  }
  if (report.chainageIL?.readings?.length > 0) {
    tools.push(`${report.chainageIL.readings.length} chainage calculations`);
  }
  if (report.generalNotes?.notes?.length > 0) {
    tools.push(`${report.generalNotes.notes.length} notes`);
  }
  
  if (tools.length === 0) {
    return '<p class="report-summary">Empty report</p>';
  }
  
  return `<p class="report-summary">${tools.join(' • ')}</p>`;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for window object
export const savedReportsFunctions = {
  renderSavedReports,
  loadReportById,
  deleteReportById
};
