// This object will be populated by Vercel's environment variables
const firebaseConfig = {
    apiKey: "%VITE_FIREBASE_API_KEY%",
    authDomain: "%VITE_FIREBASE_AUTH_DOMAIN%",
    projectId: "%VITE_FIREBASE_PROJECT_ID%",
    storageBucket: "%VITE_FIREBASE_STORAGE_BUCKET%",
    messagingSenderId: "%VITE_FIREBASE_MESSAGING_SENDER_ID%",
    appId: "%VITE_FIREBASE_APP_ID%"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();