// Import the 2nd Gen onCall function from the https submodule.
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase Admin SDK
admin.initializeApp();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

// Export the 2nd Gen function.
// Cost control options like maxInstances are now passed in an object.
exports.sendSignInLink = onCall({ maxInstances: 10 }, async (request) => {
  // In 2nd Gen onCall, data is available in request.data
  const email = request.data.email;
  const redirectUrl = request.data.redirectUrl;

  const actionCodeSettings = {
    url: 'https://panthermarket.app/verify.html',
    handleCodeInApp: true,
  };

  try {
    const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

    const msg = {
      to: email,
      from: "support@panthermarket.app",
      subject: "Your Sign-In Link for PantherMarket",
      html: `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Welcome to PantherMarket!</h2>
          <p>Click the button below to sign in securely.</p>
          <a href="${link}" style="background-color: #0033a0; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Sign In</a>
          <p>If you did not request this email, you can safely ignore it.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return { success: true, message: "Sign-in link sent successfully!" };

  } catch (error) {
    console.error("Error sending email:", error);
    // Throw an error to the client
    throw new functions.https.HttpsError("internal", "Unable to send sign-in link.");
  }
});