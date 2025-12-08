/**
 * Firebase Configuration and Initialization
 * This file initializes Firebase services for the PurposeMobile Field Tools app
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIW7Sd8A2Hj6WCcTOBKFMicthdCigORKQ",
  authDomain: "purposemobile-field-tools.firebaseapp.com",
  projectId: "purposemobile-field-tools",
  storageBucket: "purposemobile-field-tools.firebasestorage.app",
  messagingSenderId: "891906440026",
  appId: "1:891906440026:web:03f19a5e56267e11e55163"
};

// Initialize Firebase (will be done after imports in main app)
let app;
let auth;
let db;

// Export config for use in other modules
export { firebaseConfig, app, auth, db };

/**
 * Initialize Firebase services
 * Called from app.js after Firebase SDK is loaded
 */
export function initializeFirebase(firebase) {
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.getAuth(app);
    db = firebase.getFirestore(app);
    
    console.log('âœ… Firebase initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('âŒ Firebase initialization error:', error);
    throw error;
  }
}
