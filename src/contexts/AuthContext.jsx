import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { post } from '../api/client';

// Firebase configuration
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
const auth = getAuth(app);

// Create Auth Context
const AuthContext = createContext(null);

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
 * AuthProvider component - wraps the app and provides auth state
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Initialize from localStorage for instant render
        const saved = localStorage.getItem('mindstore_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                    tier: 'free', // Default tier
                };
                setUser(userData);
                localStorage.setItem('mindstore_user', JSON.stringify(userData));

                // Sync to extension
                syncUserIdToExtension(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);

                // Ensure backend Firestore profile exists (register if missing)
                try {
                    await post('/auth/register', {
                        userId: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || null,
                    });
                } catch (e) {
                    // Non-fatal; backend will still work without profile, but admin email join prefers it
                    console.log('⚠️ Backend register skipped:', e.message || e);
                }
            } else {
                setUser(null);
                localStorage.removeItem('mindstore_user');
                syncUserIdToExtension(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = useCallback(async (email, password) => {
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Sign up with email and password
    const signUp = useCallback(async (email, password) => {
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Sign out
    const logout = useCallback(async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const value = {
        user,
        loading,
        error,
        signIn,
        signUp,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth hook - access auth state and methods from any component
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
