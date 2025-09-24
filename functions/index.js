const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const Brevo = require('@getbrevo/brevo');

admin.initializeApp();

// Firestore trigger for sending verification code when user document is created
exports.sendVerificationCode = onDocumentCreated(
  { 
    document: "users/{userId}", 
    secrets: ["BREVO_KEY"] 
  }, 
  async (event) => {
    const userId = event.params.userId;
    const data = event.data.data();
    const email = data.email;

    if (!email) {
      console.log(`User document ${userId} created without an email, skipping.`);
      return null;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 15 * 60 * 1000);

    await admin.firestore().collection('verifications').doc(userId).set({
      code: code,
      email: email,
      expiresAt: expiration,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    try {
      const brevoApiKey = process.env.BREVO_KEY;
      if (!brevoApiKey) {
        console.error("FATAL: Brevo API key is not available in the environment.");
        return null;
      }

      const defaultClient = Brevo.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = brevoApiKey;

      const apiInstance = new Brevo.TransactionalEmailsApi();
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      
      sendSmtpEmail.subject = "Your PantherMarket Verification Code";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #0033a0; margin-bottom: 10px;">Welcome to PantherMarket!</h1>
            <p style="color: #666; font-size: 16px;">Please verify your GSU email address</p>
          </div>
          <div style="background: #f5f5f5; border-radius: 10px; padding: 30px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
            <div style="background: white; border: 2px solid #0033a0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0033a0;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in 15 minutes</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `;
      sendSmtpEmail.sender = { "name": "PantherMarket", "email": "noreply@panthermarket.app" };
      sendSmtpEmail.to = [{ "email": email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Verification code sent successfully to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending Brevo email:', error.response?.body || error.message);
      return { success: false, error: error.message };
    }
  }
);

// Callable function for verifying the code
exports.verifyEmailCode = onCall(
  { 
    secrets: ["BREVO_KEY"],
    cors: true
  }, 
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to verify your email.');
    }

    const uid = request.auth.uid;
    const code = request.data.code;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Verification code is required.');
    }

    const verificationDoc = admin.firestore().collection('verifications').doc(uid);
    const doc = await verificationDoc.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'No verification code found. Please request a new one.');
    }

    const { code: correctCode, expiresAt } = doc.data();

    if (expiresAt.toDate() < new Date()) {
      await verificationDoc.delete();
      throw new HttpsError('deadline-exceeded', 'This verification code has expired. Please request a new one.');
    }

    if (code !== correctCode) {
      throw new HttpsError('invalid-argument', 'Invalid verification code. Please try again.');
    }

    try {
      await admin.auth().updateUser(uid, { emailVerified: true });
      await verificationDoc.delete();
      console.log(`Email verified successfully for user ${uid}`);
      return { success: true, message: "Email verified successfully!" };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new HttpsError('internal', 'Failed to verify email. Please try again.');
    }
  }
);

// Callable function for resending verification code
exports.resendVerificationCode = onCall(
  { 
    secrets: ["BREVO_KEY"],
    cors: true
  }, 
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const uid = request.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found.');
    }

    const email = userDoc.data().email;
    
    const existingVerification = await admin.firestore().collection('verifications').doc(uid).get();
    if (existingVerification.exists) {
      const { expiresAt } = existingVerification.data();
      if (expiresAt.toDate() > new Date()) {
        const remainingMinutes = Math.ceil((expiresAt.toDate() - new Date()) / 60000);
        throw new HttpsError('already-exists', `A valid code was already sent. It expires in ${remainingMinutes} minutes.`);
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 15 * 60 * 1000);

    await admin.firestore().collection('verifications').doc(uid).set({
      code: code,
      email: email,
      expiresAt: expiration,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    try {
      const brevoApiKey = process.env.BREVO_KEY;
      if (!brevoApiKey) {
        throw new HttpsError('internal', 'Email service not configured.');
      }

      const defaultClient = Brevo.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = brevoApiKey;

      const apiInstance = new Brevo.TransactionalEmailsApi();
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      
      sendSmtpEmail.subject = "Your New PantherMarket Verification Code";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #0033a0; margin-bottom: 10px;">New Verification Code</h1>
            <p style="color: #666; font-size: 16px;">Here's your new verification code</p>
          </div>
          <div style="background: #f5f5f5; border-radius: 10px; padding: 30px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Your new verification code is:</p>
            <div style="background: white; border: 2px solid #0033a0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0033a0;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in 15 minutes</p>
          </div>
        </div>
      `;
      sendSmtpEmail.sender = { "name": "PantherMarket", "email": "noreply@panthermarket.app" };
      sendSmtpEmail.to = [{ "email": email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`New verification code sent to ${email}`);
      return { success: true, message: "New verification code sent! Check your email." };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new HttpsError('internal', 'Failed to send verification code. Please try again.');
    }
  }
);