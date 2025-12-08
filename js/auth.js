/**
 * Authentication Module
 * Handles user signup, login, logout, and auth state management
 */

import { showNotification } from './ui.js';

let auth = null;
let currentUser = null;

/**
 * Initialize authentication
 */
export function initAuth(firebaseAuth) {
  auth = firebaseAuth;
  
  // Listen for auth state changes
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI(user);
    
    if (user) {
      console.log('âœ… User logged in:', user.email);
      showNotification(`Welcome back, ${user.email}!`);
    } else {
      console.log('ðŸ‘¤ No user logged in');
    }
  });
}

/**
 * Sign up new user
 */
export async function signUp(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    showNotification('Account created successfully!');
    hideAuthModal();
    return userCredential.user;
  } catch (error) {
    console.error('Signup error:', error);
    let message = 'Failed to create account';
    
    if (error.code === 'auth/email-already-in-use') {
      message = 'Email already in use';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    }
    
    showNotification(message, 'error');
    throw error;
  }
}

/**
 * Log in existing user
 */
export async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    showNotification('Logged in successfully!');
    hideAuthModal();
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    let message = 'Failed to log in';
    
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    }
    
    showNotification(message, 'error');
    throw error;
  }
}

/**
 * Log out current user
 */
export async function logout() {
  try {
    await auth.signOut();
    showNotification('Logged out successfully');
    currentUser = null;
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Failed to log out', 'error');
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    showNotification('Password reset email sent!');
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    showNotification('Failed to send reset email', 'error');
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Update UI based on auth state
 */
function updateAuthUI(user) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userEmail = document.getElementById('userEmail');
  const savedReportsTab = document.querySelector('[data-tab="savedreports"]');
  
  if (user) {
    // User is logged in
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (userEmail) {
      userEmail.textContent = user.email;
      userEmail.classList.remove('hidden');
    }
    if (savedReportsTab) savedReportsTab.classList.remove('hidden');
  } else {
    // User is logged out
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (userEmail) userEmail.classList.add('hidden');
    if (savedReportsTab) savedReportsTab.classList.add('hidden');
  }
}

/**
 * Show auth modal
 */
export function showAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm = document.getElementById('resetForm');
  
  if (!modal) return;
  
  // Hide all forms
  if (loginForm) loginForm.classList.add('hidden');
  if (signupForm) signupForm.classList.add('hidden');
  if (resetForm) resetForm.classList.add('hidden');
  
  // Show requested form
  if (mode === 'login' && loginForm) {
    loginForm.classList.remove('hidden');
  } else if (mode === 'signup' && signupForm) {
    signupForm.classList.remove('hidden');
  } else if (mode === 'reset' && resetForm) {
    resetForm.classList.remove('hidden');
  }
  
  modal.classList.remove('hidden');
}

/**
 * Hide auth modal
 */
export function hideAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Handle login form submission
 */
export function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  login(email, password);
}

/**
 * Handle signup form submission
 */
export function handleSignupSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  signUp(email, password);
}

/**
 * Handle password reset form submission
 */
export function handleResetSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('resetEmail').value;
  resetPassword(email);
}

// Export for window object
export const authFunctions = {
  showAuthModal,
  hideAuthModal,
  handleLoginSubmit,
  handleSignupSubmit,
  handleResetSubmit,
  logout
};
