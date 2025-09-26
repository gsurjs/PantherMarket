import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin SDK if it hasn't been already
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore(); // Get a reference to Firestore

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Method Not Allowed' });
  }

  try {
    const { oobCode, recaptchaToken } = request.body;

    if (!oobCode || !recaptchaToken) {
      return response.status(400).send({ error: "Missing required information." });
    }

    // 1. Verify the reCAPTCHA token with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

    const recaptchaResponse = await axios.post(verificationUrl);
    if (!recaptchaResponse.data.success) {
      return response.status(400).send({ error: "CAPTCHA verification failed. Please try again." });
    }

    // 2. Get user UID from the action code BEFORE applying it
    const info = await admin.auth().checkActionCode(oobCode);
    const userUid = info.data.uid;

    // 3. Apply the email verification code in Firebase Auth
    await admin.auth().applyActionCode(oobCode);

    // 4. Update the user's document in Firestore to set our custom flag
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