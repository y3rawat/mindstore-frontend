// Firebase Client SDK Configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

/**
 * Sync Firebase userId to Chrome extension storage
 * Uses window.postMessage which the extension's content script receives
 */
function syncUserIdToExtension(userId, email = null, displayName = null) {
    // Store in localStorage (always works)
    if (userId) {
        localStorage.setItem('firebaseUserId', userId);
    } else {
        localStorage.removeItem('firebaseUserId');
    }

    // Send message to extension content script (if loaded)
    window.postMessage({
        type: 'MINDSTORE_AUTH_SYNC',
        userId: userId,
        email: email,
        displayName: displayName,
    }, '*');

    console.log(userId ? `✅ Auth synced: ${userId}` : '🗑️ Auth cleared');
}

/**
 * Listen to auth state changes and sync to extension
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        // Sync userId to extension
        syncUserIdToExtension(user?.uid || null, user?.email, user?.displayName);

        // Store user in localStorage for persistence
        if (user) {
            const userData = {
                id: user.uid,
                email: user.email,
                displayName: user.displayName,
                tier: 'personal',
            };
            localStorage.setItem('mindstore_user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('mindstore_user');
        }

        callback(user);
    });
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Sign up with email and password
 */
export async function signUp(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Sign out
 */
export async function logout() {
    await signOut(auth);
}

export default app;
