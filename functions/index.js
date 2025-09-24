// Import necessary modules
const { onCall } = require("firebase-functions/v2/https");
const { user } = require("firebase-functions/v1/auth");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Brevo = require('@getbrevo/brevo');

admin.initializeApp();

/**
 * 1. Generates and sends a 6-digit verification code when a new user signs up.
 */
exports.sendVerificationCode = user().onCreate(async (user) => {
  if (!user.email) {
    console.log(`User ${user.uid} has no email, skipping.`);
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiration

  await admin.firestore().collection('verifications').doc(user.uid).set({
    code: code,
    email: user.email,
    expiresAt: expiration
  });

  // --- CORRECT Brevo API Client Initialization and Sending ---
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    
    // Authenticate with the API key from your environment variables
    const apiKey = apiInstance.authentications['api-key'];
    apiKey.apiKey = functions.config().brevo.key;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Your PantherMarket Verification Code";
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
        <h1 style="color: #0033a0;">Here is your verification code:</h1>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">${code}</p>
        <p>This code will expire in 15 minutes. Enter it on the verification page to activate your account.</p>
      </div>
    `;
    sendSmtpEmail.sender = { "name": "PantherMarket", "email": "noreply@panthermarket.app" };
    sendSmtpEmail.to = [{ "email": user.email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Verification code sent to ${user.email} via Brevo.`);
  } catch (error) {
    console.error('Error sending Brevo email:', error);
  }
});

/**
 * 2. A callable function that verifies the code submitted by the user.
 * (This function does not need to be changed)
 */
exports.verifyEmailCode = onCall(async (request) => {
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
    await verificationDoc.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'This code has expired.');
  }

  if (code !== correctCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid code, please try again.');
  }

  await admin.auth().updateUser(uid, { emailVerified: true });
  await verificationDoc.delete();

  return { success: true, message: "Email verified successfully!" };
});