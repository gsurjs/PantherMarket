const admin = require('firebase-admin');
const axios = require('axios');

// We still need the admin SDK, but ONLY for updating Firestore.
if (!admin.apps.length) {
  const serviceAccountString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountString);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Method Not Allowed' });
  }

  try {
    const { oobCode, recaptchaToken } = request.body;
    const apiKey = process.env.VITE_FIREBASE_API_KEY;

    if (!oobCode || !recaptchaToken || !apiKey) {
      return response.status(400).send({ error: "Missing required information or server configuration." });
    }

    // 1. Verify the reCAPTCHA token (no change here)
    const recaptchaSecret = process.env.VITE_RECAPTCHA_SECRET_KEY;
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
    const recaptchaResponse = await axios.post(recaptchaUrl);
    if (!recaptchaResponse.data.success) {
      return response.status(400).send({ error: "CAPTCHA verification failed. Please try again." });
    }

    // 2. Check the action code to get the user's UID.
    // This part is working correctly and remains the same.
    const checkCodeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    const checkCodeResponse = await axios.post(checkCodeUrl, { oobCode: oobCode });
    const userUid = checkCodeResponse.data.users[0].localId;

    if (!userUid) {
      throw new Error("Could not retrieve user information from verification code.");
    }
    
    // 3. CORRECTED: Apply the action code using the correct REST API endpoint.
    // This is the only line that has changed.
    const applyCodeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
    await axios.post(applyCodeUrl, { oobCode: oobCode });

    // 4. Update the user's document in Firestore.
    const userDocRef = db.collection('users').doc(userUid);
    await userDocRef.update({ isManuallyVerified: true });

    return response.status(200).send({ message: "Email verified successfully!" });

  } catch (error) {
    console.error("Verification process failed:", error.response ? error.response.data : error);
    if (error.response && error.response.data.error.message === 'INVALID_OOB_CODE') {
        return response.status(400).send({ error: "This link is invalid or has already been used." });
    }
    return response.status(500).send({ error: "An unexpected error occurred." });
  }
};