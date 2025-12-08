/**
 * Calculator Module
 * Simple calculator for quick field calculations
 * No saving, no reports - just math
 */

import { showNotification } from './ui.js';

// Calculator state
let calcState = {
    display: '0',
    currentValue: null,
    previousValue: null,
    operation: null,
    shouldResetDisplay: false,
    history: []
};

/**
 * Initialize calculator
 */
export function initCalculator() {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('calcHistory');
    if (savedHistory) {
        try {
            calcState.history = JSON.parse(savedHistory);
            renderHistory();
        } catch (e) {
            calcState.history = [];
        }
    }
    
    console.log('âœ… Calculator initialized');
}

/**
 * Handle number/decimal input
 */
export function calcInput(value) {
    if (calcState.shouldResetDisplay) {
        calcState.display = value;
        calcState.shouldResetDisplay = false;
    } else {
        // Prevent multiple decimals
        if (value === '.' && calcState.display.includes('.')) {
            return;
        }
        
        // Replace leading zero
        if (calcState.display === '0' && value !== '.') {
            calcState.display = value;
        } else {
            calcState.display += value;
        }
    }
    
    updateDisplay();
}

/**
 * Handle operation (+, -, ×, ÷)
 */
export function calcOperation(op) {
    const current = parseFloat(calcState.display);
    
    // If we already have an operation pending, calculate it first
    if (calcState.operation !== null && !calcState.shouldResetDisplay) {
        calcEquals();
    }
    
    calcState.previousValue = parseFloat(calcState.display);
    calcState.operation = op;
    calcState.shouldResetDisplay = true;
}

/**
 * Calculate result (=)
 */
export function calcEquals() {
    if (calcState.operation === null || calcState.previousValue === null) {
        return;
    }
    
    const prev = calcState.previousValue;
    const current = parseFloat(calcState.display);
    let result;
    let operationSymbol = calcState.operation;
    
    switch (calcState.operation) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '×':
            result = prev * current;
            break;
        case '÷':
            if (current === 0) {
                showNotification('Cannot divide by zero', 'error');
                calcClearAll();
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }
    
    // Add to history
    const calculation = `${formatNumber(prev)} ${operationSymbol} ${formatNumber(current)} = ${formatNumber(result)}`;
    addToHistory(calculation);
    
    // Update display
    calcState.display = result.toString();
    calcState.currentValue = result;
    calcState.previousValue = null;
    calcState.operation = null;
    calcState.shouldResetDisplay = true;
    
    updateDisplay();
}

/**
 * Clear current entry (C)
 */
export function calcClear() {
    calcState.display = '0';
    calcState.shouldResetDisplay = false;
    updateDisplay();
}

/**
 * Clear all (AC)
 */
export function calcClearAll() {
    calcState.display = '0';
    calcState.currentValue = null;
    calcState.previousValue = null;
    calcState.operation = null;
    calcState.shouldResetDisplay = false;
    updateDisplay();
}

/**
 * Copy result to clipboard
 */
export function calcCopyResult() {
    const value = calcState.display;
    
    navigator.clipboard.writeText(value).then(() => {
        showNotification(`Copied: ${value}`);
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification(`Copied: ${value}`);
        } catch (e) {
            showNotification('Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
    });
}

/**
 * Add calculation to history
 */
function addToHistory(calculation) {
    calcState.history.unshift(calculation);
    
    // Keep only last 10
    if (calcState.history.length > 10) {
        calcState.history = calcState.history.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('calcHistory', JSON.stringify(calcState.history));
    
    renderHistory();
}

/**
 * Clear history
 */
export function calcClearHistory() {
    if (calcState.history.length === 0) {
        showNotification('History is already empty', 'warning');
        return;
    }
    
    if (!confirm('Clear calculation history?')) {
        return;
    }
    
    calcState.history = [];
    localStorage.removeItem('calcHistory');
    renderHistory();
    showNotification('History cleared');
}

/**
 * Render history list
 */
function renderHistory() {
    const historyContainer = document.getElementById('calcHistory');
    
    if (!historyContainer) return;
    
    if (calcState.history.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.9rem;">
                No calculations yet
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = calcState.history.map((calc, index) => `
        <div style="padding: 10px; border-bottom: 1px solid var(--border-light); font-family: 'SF Mono', Monaco, monospace; font-size: 0.9rem; color: var(--text-primary); display: flex; justify-content: space-between; align-items: center;">
            <span>${calc}</span>
            <button onclick="window.calcCopyHistoryItem(${index})" style="background: transparent; border: 1px solid var(--border); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Copy history item
 */
export function calcCopyHistoryItem(index) {
    const item = calcState.history[index];
    if (!item) return;
    
    // Extract just the result (after =)
    const result = item.split('=')[1].trim();
    
    navigator.clipboard.writeText(result).then(() => {
        showNotification(`Copied: ${result}`);
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

/**
 * Update display
 */
function updateDisplay() {
    const displayElement = document.getElementById('calcDisplay');
    if (displayElement) {
        // Format display value
        let displayValue = calcState.display;
        
        // Limit decimal places for display
        if (displayValue.includes('.')) {
            const parts = displayValue.split('.');
            if (parts[1] && parts[1].length > 8) {
                displayValue = parseFloat(displayValue).toFixed(8);
                // Remove trailing zeros
                displayValue = displayValue.replace(/\.?0+$/, '');
            }
        }
        
        displayElement.textContent = displayValue;
    }
}

/**
 * Format number for display
 */
function formatNumber(num) {
    // Remove unnecessary decimals
    if (Number.isInteger(num)) {
        return num.toString();
    }
    
    // Limit to 6 decimal places and remove trailing zeros
    let formatted = num.toFixed(8);
    formatted = formatted.replace(/\.?0+$/, '');
    
    return formatted;
}

// Export functions
export const calculatorFunctions = {
    initCalculator,
    calcInput,
    calcOperation,
    calcEquals,
    calcClear,
    calcClearAll,
    calcCopyResult,
    calcClearHistory,
    calcCopyHistoryItem
};

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.calcInput = calcInput;
    window.calcOperation = calcOperation;
    window.calcEquals = calcEquals;
    window.calcClear = calcClear;
    window.calcClearAll = calcClearAll;
    window.calcCopyResult = calcCopyResult;
    window.calcClearHistory = calcClearHistory;
    window.calcCopyHistoryItem = calcCopyHistoryItem;
}
