const admin = require('firebase-admin');
const axios = require('axios');

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Method Not Allowed' });
  }

  try {
    if (!admin.apps.length) {
      const serviceAccountString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    const db = admin.firestore();
    const { oobCode, recaptchaToken } = request.body;

    if (!oobCode || !recaptchaToken) {
      return response.status(400).send({ error: "Missing required information." });
    }

    const recaptchaSecret = process.env.VITE_RECAPTCHA_SECRET_KEY; // Using the name from your screenshot
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

    const recaptchaResponse = await axios.post(verificationUrl);
    if (!recaptchaResponse.data.success) {
      return response.status(400).send({ error: "CAPTCHA verification failed. Please try again." });
    }

    // --- NEW DEBUGGING LINE ---
    // This will print all available function names on the auth object to your Vercel logs.
    console.log('Available auth methods:', Object.keys(admin.auth()));

    // 2. Get user UID from the action code BEFORE applying it
    const info = await admin.auth().checkActionCode(oobCode); // This is the line that has been failing
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
};