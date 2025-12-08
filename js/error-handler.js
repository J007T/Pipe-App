/**
 * PurposeMobile Field Tools - Error Handler
 * Centralized error handling and logging
 */

export function logError(error, context) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        context,
        error: error.message,
        stack: error.stack
    };
    
    console.error(`[${timestamp}] ${context}:`, error);
    
    // Store in localStorage for debugging
    try {
        const errorLog = JSON.parse(localStorage.getItem('error-log') || '[]');
        errorLog.push(errorInfo);
        
        // Keep only last 50 errors
        if (errorLog.length > 50) {
            errorLog.shift();
        }
        
        localStorage.setItem('error-log', JSON.stringify(errorLog));
    } catch (e) {
        console.error('Failed to log error:', e);
    }
}

export function wrapWithErrorHandling(fn, context) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            logError(error, context);
            if (window.showNotification) {
                window.showNotification(`Error in ${context}: ${error.message}`, 'error');
            }
            throw error;
        }
    };
}
