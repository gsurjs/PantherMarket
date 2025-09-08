const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- SECURE FIREBASE ADMIN INITIALIZATION ---
let serviceAccount;
// This 'if' block runs on Vercel
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
// This 'else' block is for local testing (requires the key file)
  serviceAccount = require('../server/config/serviceAccountKey.json');
}

// Prevent re-initialization error when Vercel re-uses the function
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const app = express();
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
// Basic test route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is responding correctly!' });
});


app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Server-side validation (CRITICAL for security) ---
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const isValidGsuEmail = email.endsWith('@student.gsu.edu') || email.endsWith('@gsu.edu');
    if (!isValidGsuEmail) {
      return res.status(400).json({ message: 'Only GSU email addresses are allowed.' });
    }

    // --- Use Firebase Admin SDK to create the user ---
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });
    
    // Create a user profile in Firestore
    // To store extra info like name, ratings, etc.
    await admin.firestore().collection('users').doc(userRecord.uid).set({
        email: userRecord.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sellerRating: [],
        buyerRating: [],
    });

    res.status(201).json({ message: 'User created successfully!', uid: userRecord.uid });

  } catch (error) {
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'This email address is already registered.' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- EXPORT FOR VERCEL ---
module.exports = app;