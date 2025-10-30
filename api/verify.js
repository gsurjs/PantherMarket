const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK
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

    // 1. Verify the reCAPTCHA token
    const recaptchaSecret = process.env.VITE_RECAPTCHA_SECRET_KEY;
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
    const recaptchaResponse = await axios.post(recaptchaUrl);
    
    if (!recaptchaResponse.data.success) {
      return response.status(400).send({ error: "CAPTCHA verification failed. Please try again." });
    }

    // 2. Check the action code and get email
    const checkCodeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;
    let checkResponse;
    
    try {
      checkResponse = await axios.post(checkCodeUrl, { oobCode: oobCode });
    } catch (error) {
      if (error.response?.data?.error?.message === 'INVALID_OOB_CODE') {
        return response.status(400).send({ error: "This link is invalid or has already been used." });
      }
      throw error;
    }

    const userEmail = checkResponse.data.email;
    
    if (!userEmail) {
      return response.status(400).send({ error: "Could not retrieve user information from verification code." });
    }

    // 3. Apply the verification code
    // Firebase email verification codes are applied through the confirmEmailVerification endpoint
    const confirmUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
    
    try {
      await axios.post(confirmUrl, { 
        oobCode: oobCode 
      });
    } catch (error) {
      // If the update endpoint fails with the oobCode alone, 
      // it might be because the code was already used
      if (error.response?.data?.error?.message === 'INVALID_OOB_CODE') {
        // Check if the user is already verified
        try {
          const userRecord = await admin.auth().getUserByEmail(userEmail);
          if (!userRecord.emailVerified) {
            throw error; // Re-throw if not verified
          }
          // Continue if already verified
        } catch (adminError) {
          return response.status(400).send({ error: "This verification link is invalid or has already been used." });
        }
      } else {
        throw error;
      }
    }

    // 4. Get the user's UID using Admin SDK
    const userRecord = await admin.auth().getUserByEmail(userEmail);
    const userUid = userRecord.uid;

    // 5. Update the user's emailVerified status using Admin SDK
    // This ensures the email is marked as verified in Firebase Auth
    await admin.auth().updateUser(userUid, {
      emailVerified: true
    });

    // 6. Update the user's document in Firestore
    const userDocRef = db.collection('users').doc(userUid);
    await userDocRef.update({ 
      isManuallyVerified: true,
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return response.status(200).send({ 
      message: "Email verified successfully!",
      email: userEmail 
    });

  } catch (error) {
    console.error("Verification process failed:", error.response ? error.response.data : error.message);
    
    // Handle specific error cases
    if (error.response?.data?.error?.message === 'EXPIRED_OOB_CODE') {
      return response.status(400).send({ error: "This verification link has expired. Please request a new one." });
    }
    
    if (error.code === 'auth/user-not-found') {
      return response.status(400).send({ error: "User account not found." });
    }
    
    return response.status(500).send({ error: "An unexpected error occurred during verification. Please try again." });
  }
};