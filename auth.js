import { auth } from './firebase.js';

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const signupNameInput = document.getElementById('signupName');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword');

const STORAGE_KEYS = {
    userProfiles: 'studyPlannerProfiles',
    currentUser: 'studyPlannerCurrentUser',
    theme: 'studyPlannerTheme'
};

let userProfiles = {};

function saveUserProfiles() {
    localStorage.setItem(STORAGE_KEYS.userProfiles, JSON.stringify(userProfiles));
}

function loadUserProfiles() {
    const stored = localStorage.getItem(STORAGE_KEYS.userProfiles);
    userProfiles = stored ? JSON.parse(stored) : {};
}

function setCurrentUser(uid) {
    localStorage.setItem(STORAGE_KEYS.currentUser, uid || '');
}

function getCurrentUserUID() {
    return localStorage.getItem(STORAGE_KEYS.currentUser);
}

function createUserProfile(uid, name, email) {
    if (!userProfiles[uid]) {
        userProfiles[uid] = {
            uid,
            name: name || email.split('@')[0],
            email,
            profile: { name: name || email.split('@')[0], weeklyHours: 15 },
            subjects: [],
            tasks: [],
            schedule: []
        };
        saveUserProfiles();
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        setCurrentUser(user.uid);

        if (!userProfiles[user.uid]) {
            createUserProfile(user.uid, user.displayName, user.email);
        }

        window.location.href = 'index.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const name = signupNameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;

    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all signup fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please confirm your password.');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        setCurrentUser(user.uid);

        createUserProfile(user.uid, name, email);

        window.location.href = 'index.html';
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
}

function initAuthPage() {
    loadUserProfiles();

    auth.onAuthStateChanged((user) => {
        if (user) {
            setCurrentUser(user.uid);
            if (!userProfiles[user.uid]) {
                createUserProfile(user.uid, user.displayName, user.email);
            }
            window.location.href = 'index.html';
        }
    });
}

if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (signupForm) signupForm.addEventListener('submit', handleSignup);

window.addEventListener('load', initAuthPage);

// Export functions for planner.js
export function logoutUser() {
    return auth.signOut().then(() => {
        setCurrentUser('');
        window.location.href = 'login.html';
    });
}
