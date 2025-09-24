// Import necessary modules
const { onCall } = require("firebase-functions/v2/https");
const { user } = require("firebase-functions/v1/auth");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * 1. Generates and sends a 6-digit verification code when a new user signs up.
 */
exports.sendVerificationCode = user().onCreate(async (user) => {
  if (!user.email) {
    return;
  }

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiration

  // Save the code and expiration in Firestore
  await admin.firestore().collection('verifications').doc(user.uid).set({
    code: code,
    email: user.email,
    expiresAt: expiration
  });

  // Create the email message
  const msg = {
    to: user.email,
    from: {
      name: 'PantherMarket',
      email: 'support@panthermarket.app'
    },
    subject: 'Your PantherMarket Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
        <h1 style="color: #0033a0;">Here is your verification code:</h1>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">${code}</p>
        <p>This code will expire in 15 minutes. Enter it on the verification page to activate your account.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification code sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending verification code:', error);
  }
});


/**
 * 2. A callable function that verifies the code submitted by the user.
 */
exports.verifyEmailCode = onCall(async (request) => {
  // The user's auth token is automatically verified by onCall
  const uid = request.auth.uid;
  const code = request.data.code;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  const verificationDoc = admin.firestore().collection('verifications').doc(uid);
  const doc = await verificationDoc.get();

  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid code, please try again.');
  }

  const { code: correctCode, expiresAt } = doc.data();

  if (expiresAt.toDate() < new Date()) {
    await verificationDoc.delete(); // Clean up expired code
    throw new functions.https.HttpsError('deadline-exceeded', 'This code has expired. Please log out and log back in to get a new code.');
  }

  if (code !== correctCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid code, please try again.');
  }

  // If code is correct, update the user's auth record
  await admin.auth().updateUser(uid, { emailVerified: true });

  // Delete the used verification code
  await verificationDoc.delete();

  return { success: true, message: "Email verified successfully!" };
});