/**
 * FIREBASE DIAGNOSTIC SCRIPT
 * 
 * Run this in your browser console (F12) to diagnose Firebase issues
 * 
 * HOW TO USE:
 * 1. Open your app in browser
 * 2. Press F12 to open Developer Tools
 * 3. Click "Console" tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Read the diagnosis report
 */

console.log('====================================');
console.log('FIREBASE DIAGNOSTIC REPORT');
console.log('====================================\n');

// Test 1: Check if Firebase is loaded
console.log('TEST 1: Firebase SDK Loaded');
if (window._firebaseAuth && window._firebaseDb) {
    console.log('[OK] Firebase SDK is loaded');
} else {
    console.error('[ERROR] Firebase SDK not loaded');
    console.log('  - Check if Firebase scripts are included in index.html');
    console.log('  - Look for errors in Network tab');
}
console.log('');

// Test 2: Check authentication
console.log('TEST 2: User Authentication');
if (window._firebaseAuth) {
    const user = window._firebaseAuth.currentUser;
    if (user) {
        console.log('[OK] User is logged in');
        console.log('  - Email:', user.email);
        console.log('  - User ID:', user.uid);
    } else {
        console.warn('[WARNING] No user logged in');
        console.log('  - Click "Login" button to sign in');
    }
} else {
    console.error('[ERROR] Firebase Auth not initialized');
}
console.log('');

// Test 3: Try to query reports
console.log('TEST 3: Database Query Test');
if (window._firebaseDb && window._firebaseAuth?.currentUser) {
    console.log('Testing database query...');
    
    window._firebaseDb.collection('reports')
        .where('userId', '==', window._firebaseAuth.currentUser.uid)
        .orderBy('updatedAt', 'desc')
        .get()
        .then(snapshot => {
            console.log('[OK] Query successful!');
            console.log('  - Found', snapshot.size, 'report(s)');
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('  - Report:', doc.id);
                console.log('    Project:', data.projectName, data.stage);
                console.log('    Updated:', data.updatedAt);
            });
            
            if (snapshot.size === 0) {
                console.log('\n[INFO] No reports found. This is normal if you haven\'t saved any yet.');
            }
        })
        .catch(error => {
            console.error('[ERROR] Query failed!');
            console.error('  - Error code:', error.code);
            console.error('  - Error message:', error.message);
            
            if (error.code === 'failed-precondition') {
                console.log('\n[FIX REQUIRED] Firestore Index Missing');
                console.log('  You need to create a composite index:');
                console.log('  1. Go to https://console.firebase.google.com');
                console.log('  2. Select project: purposemobile-field-tools');
                console.log('  3. Go to Firestore Database → Indexes');
                console.log('  4. Click "Create Index"');
                console.log('  5. Collection: reports');
                console.log('  6. Field: userId (Ascending)');
                console.log('  7. Field: updatedAt (Descending)');
                console.log('  8. Click Create and wait 2-5 minutes');
            } else if (error.code === 'permission-denied') {
                console.log('\n[FIX REQUIRED] Permission Denied');
                console.log('  Check Firestore security rules in Firebase Console');
            }
        });
} else {
    if (!window._firebaseDb) {
        console.error('[ERROR] Database not initialized');
    }
    if (!window._firebaseAuth?.currentUser) {
        console.warn('[WARNING] Cannot test query - no user logged in');
    }
}
console.log('');

// Test 4: Check saved reports container
console.log('TEST 4: UI Elements');
const container = document.getElementById('savedReportsContainer');
if (container) {
    console.log('[OK] Saved reports container found');
} else {
    console.error('[ERROR] Saved reports container not found');
    console.log('  - Make sure you\'re on the Saved Reports tab');
}
console.log('');

// Test 5: Check if functions are exposed to window
console.log('TEST 5: Function Availability');
const functions = [
    'refreshSavedReports',
    'viewReport',
    'editReport',
    'copyReportMessage',
    'deleteReportConfirm',
    'showAuthModal'
];

let allFunctionsAvailable = true;
functions.forEach(fn => {
    if (typeof window[fn] === 'function') {
        console.log('[OK]', fn, 'is available');
    } else {
        console.error('[ERROR]', fn, 'is NOT available');
        allFunctionsAvailable = false;
    }
});

if (!allFunctionsAvailable) {
    console.log('\n[FIX] Some functions are missing. Check that app.js has loaded correctly.');
}
console.log('');

// Summary
console.log('====================================');
console.log('DIAGNOSTIC SUMMARY');
console.log('====================================');

if (window._firebaseAuth && window._firebaseAuth.currentUser) {
    console.log('[READY] You can proceed with testing');
    console.log('\nNext steps:');
    console.log('1. Click "Saved Reports" tab');
    console.log('2. Check browser console for any errors');
    console.log('3. If you see "requires index" error, follow the fix instructions above');
} else {
    console.log('[ACTION REQUIRED] Please login first');
    console.log('\nNext steps:');
    console.log('1. Click "Login" button');
    console.log('2. Sign in with your account');
    console.log('3. Run this diagnostic script again');
}

console.log('\n====================================');
console.log('END OF DIAGNOSTIC REPORT');
console.log('====================================');
