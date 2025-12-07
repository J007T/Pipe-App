/**
 * Database Module
 * Handles all Firestore operations for saving and loading reports
 */

import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

let db = null;

/**
 * Initialize database
 */
export function initDatabase(firestore) {
  db = firestore;
  console.log('✅ Database initialized');
}

/**
 * Save current report to Firestore
 */
export async function saveReport(appState, projectName, stage) {
  const user = getCurrentUser();
  
  if (!user) {
    showNotification('Please login to save reports', 'error');
    return null;
  }
  
  if (!projectName || !stage) {
    showNotification('Please enter project name and stage', 'error');
    return null;
  }
  
  try {
    const reportData = {
      userId: user.uid,
      userEmail: user.email,
      projectName: projectName,
      stage: stage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Save all tool data
      pipeLevelCheck: appState.pipeLevelCheck,
      laser: appState.laser,
      regrade: appState.regrade,
      gradeCheck: appState.gradeCheck,
      chainageIL: appState.chainageIL,
      generalNotes: appState.generalNotes
    };
    
    // Add to Firestore
    const docRef = await db.collection('reports').add(reportData);
    
    showNotification('Report saved successfully!');
    console.log('✅ Report saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving report:', error);
    showNotification('Failed to save report', 'error');
    throw error;
  }
}

/**
 * Load all reports for current user
 */
export async function loadUserReports() {
  const user = getCurrentUser();
  
  if (!user) {
    showNotification('Please login to view saved reports', 'error');
    return [];
  }
  
  try {
    const snapshot = await db.collection('reports')
      .where('userId', '==', user.uid)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const reports = [];
    snapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Loaded ${reports.length} reports`);
    return reports;
  } catch (error) {
    console.error('Error loading reports:', error);
    showNotification('Failed to load reports', 'error');
    return [];
  }
}

/**
 * Load specific report by ID
 */
export async function loadReport(reportId) {
  const user = getCurrentUser();
  
  if (!user) {
    showNotification('Please login to load reports', 'error');
    return null;
  }
  
  try {
    const doc = await db.collection('reports').doc(reportId).get();
    
    if (!doc.exists) {
      showNotification('Report not found', 'error');
      return null;
    }
    
    const data = doc.data();
    
    // Verify user owns this report
    if (data.userId !== user.uid) {
      showNotification('Access denied', 'error');
      return null;
    }
    
    console.log('✅ Report loaded:', reportId);
    return {
      id: doc.id,
      ...data
    };
  } catch (error) {
    console.error('Error loading report:', error);
    showNotification('Failed to load report', 'error');
    return null;
  }
}

/**
 * Delete report
 */
export async function deleteReport(reportId) {
  const user = getCurrentUser();
  
  if (!user) {
    showNotification('Please login to delete reports', 'error');
    return false;
  }
  
  try {
    // First verify user owns this report
    const doc = await db.collection('reports').doc(reportId).get();
    
    if (!doc.exists) {
      showNotification('Report not found', 'error');
      return false;
    }
    
    if (doc.data().userId !== user.uid) {
      showNotification('Access denied', 'error');
      return false;
    }
    
    // Delete the report
    await db.collection('reports').doc(reportId).delete();
    
    showNotification('Report deleted');
    console.log('✅ Report deleted:', reportId);
    
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    showNotification('Failed to delete report', 'error');
    return false;
  }
}

/**
 * Update existing report
 */
export async function updateReport(reportId, appState, projectName, stage) {
  const user = getCurrentUser();
  
  if (!user) {
    showNotification('Please login to update reports', 'error');
    return false;
  }
  
  try {
    const reportData = {
      projectName: projectName,
      stage: stage,
      updatedAt: new Date().toISOString(),
      pipeLevelCheck: appState.pipeLevelCheck,
      laser: appState.laser,
      regrade: appState.regrade,
      gradeCheck: appState.gradeCheck,
      chainageIL: appState.chainageIL,
      generalNotes: appState.generalNotes
    };
    
    await db.collection('reports').doc(reportId).update(reportData);
    
    showNotification('Report updated successfully!');
    console.log('✅ Report updated:', reportId);
    
    return true;
  } catch (error) {
    console.error('Error updating report:', error);
    showNotification('Failed to update report', 'error');
    return false;
  }
}

// Export functions
export const databaseFunctions = {
  saveReport,
  loadUserReports,
  loadReport,
  deleteReport,
  updateReport
};
