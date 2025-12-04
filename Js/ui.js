/**
 * PurposeMobile Field Tools - UI Utilities
 * Theme management, notifications, tab switching, section toggles
 */

import { appState } from './state.js';
import { updateUnifiedPreview } from './message-generator.js';

/**
 * Theme Management
 */
export function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = 'fas fa-sun';
        }
    }
}

export function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
        icon.className = 'fas fa-moon';
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
    
    showNotification(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
}

/**
 * Tab Navigation
 */
export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    showNotification(`${getTabDisplayName(tabName)} activated`);
}

function getTabDisplayName(tabName) {
    const names = {
        pipelevelcheck: 'Pipe Level Check',
        laser: 'Laser Converter',
        regrade: 'Regrade Tool', 
        gradecheck: 'Grade Check',
        chainageil: 'Chainage IL',
        generalnotes: 'General Notes'
    };
    return names[tabName] || tabName;
}

/**
 * Section Toggle (Collapsible sections)
 */
export function toggleSection(sectionId, event) {
    const section = document.getElementById(sectionId);
    const header = event.currentTarget;
    
    if (!section) return;
    
    section.classList.toggle('collapsed');
    header.classList.toggle('collapsed');
    
    if (!section.classList.contains('collapsed')) {
        section.style.maxHeight = section.scrollHeight + 'px';
        setTimeout(() => {
            if (!section.classList.contains('collapsed')) {
                section.style.maxHeight = 'none';
            }
        }, 300);
    } else {
        section.style.maxHeight = section.scrollHeight + 'px';
        section.offsetHeight;
        section.style.maxHeight = '0';
    }
}

/**
 * Reference Table Toggle
 */
export function toggleReferenceTable(referenceId, event) {
    const content = document.getElementById(referenceId);
    const header = event.currentTarget;
    
    content.classList.toggle('collapsed');
    header.classList.toggle('collapsed');
}

/**
 * Reading Card Toggle
 */
export function toggleReadingCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.toggle('collapsed');
    }
}

/**
 * Notification System
 */
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationIcon = document.getElementById('notificationIcon');
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    
    notificationIcon.className = 'fas';
    if (type === 'error') {
        notificationIcon.classList.add('fa-exclamation-circle');
    } else if (type === 'warning') {
        notificationIcon.classList.add('fa-exclamation-triangle');
    } else {
        notificationIcon.classList.add('fa-check-circle');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Unified Preview Handlers
 */
export function handleUnifiedPreviewEdit() {
    appState.manualPreviewEdit = true;
    const warningElement = document.getElementById('unifiedFormatWarning');
    if (warningElement) {
        warningElement.classList.remove('hidden');
    }
}

export function copyUnifiedMessage() {
    const previewText = document.getElementById('unifiedPreviewText').value;
    
    if (!previewText || previewText.includes('Enter project information')) {
        showNotification('No report content to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(previewText).then(() => {
        showNotification('Field report copied to clipboard');
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = previewText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Field report copied to clipboard');
        } catch (e) {
            showNotification('Failed to copy report', 'error');
        }
        document.body.removeChild(textArea);
    });
}

/**
 * Utility Functions
 */
export function formatRatio(value) {
    return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}
