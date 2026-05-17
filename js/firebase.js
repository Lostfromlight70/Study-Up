const firebaseConfig = {
    apiKey: "AIzaSyCfBQI_rn2PhNZV1dI9uHGSvLNB5nCuefE",
    authDomain: "soft-ahh.firebaseapp.com",
    projectId: "soft-ahh",
    storageBucket: "soft-ahh.firebasestorage.app",
    messagingSenderId: "792389467882",
    appId: "1:792389467882:web:bf54bf072d1bbb9cc72193"
};

function ensureFirebaseIsLoaded() {
    if (!window.firebase) {
        throw new Error("Firebase SDK is not loaded. Include firebase-app-compat.js and firebase-auth-compat.js before importing this module.");
    }
    return window.firebase;
}

function initializeFirebaseAuth() {
    const firebase = ensureFirebaseIsLoaded();
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    return firebase.auth();
}

export const auth = initializeFirebaseAuth();