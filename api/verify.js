import admin from 'firebase-admin';
import axios from 'axios';

// --- START OF NEW DEBUGGING CODE ---
console.log("Starting /api/verify function...");

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount;

if (!serviceAccountString) {
  console.error("CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is missing or empty.");
} else {
  console.log(`Service Account Type: ${typeof serviceAccountString}`);
  console.log(`Service Account Length: ${serviceAccountString.length}`);
  console.log(`Starts with: ${serviceAccountString.substring(0, 50)}`);
  console.log(`Ends with: ${serviceAccountString.substring(serviceAccountString.length - 50)}`);
  
  try {
    serviceAccount = JSON.parse(serviceAccountString);
    console.log("Successfully parsed FIREBASE_SERVICE_ACCOUNT JSON.");
  } catch (e) {
    console.error("CRITICAL JSON PARSE ERROR:", e.message);
    // Log the part of the string that has the error without exposing secrets
    if (e.message.includes('at position')) {
        const position = parseInt(e.message.split(' at position ')[1]);
        const errorSnippet = serviceAccountString.substring(position - 20, position + 20);
        console.error(`Error is near this part of the string: ...${errorSnippet}...`);
    }
  }
}
// --- END OF NEW DEBUGGING CODE ---


// Initialize Firebase Admin SDK if it hasn't been already
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Method Not Allowed' });
  }

  // If initialization failed, we can't continue.
  if (!admin.apps.length) {
      console.error("Firebase Admin SDK not initialized. Cannot process request.");
      return response.status(500).send({ error: "Server configuration error." });
  }

  try {
    const { oobCode, recaptchaToken } = request.body;
    
    // ... (The rest of your function remains exactly the same)
    if (!oobCode || !recaptchaToken) {
        return response.status(400).send({ error: "Missing required information." });
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
    
    const recaptchaResponse = await axios.post(verificationUrl);
    if (!recaptchaResponse.data.success) {
        return response.status(400).send({ error: "CAPTCHA verification failed. Please try again." });
    }

    const info = await admin.auth().checkActionCode(oobCode);
    const userUid = info.data.uid;

    await admin.auth().applyActionCode(oobCode);

    const userDocRef = db.collection('users').doc(userUid);
    await userDocRef.update({ isManuallyVerified: true });

    return response.status(200).send({ message: "Email verified successfully!" });

  } catch (error) {
    console.error("Verification process failed:", error);
    if (error.code === "auth/invalid-action-code") {
      return response.status(400).send({ error: "This link is invalid or has already been used." });
    }
    return response.status(500).send({ error: "An unexpected error occurred." });
  }
}