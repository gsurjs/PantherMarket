const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.verifyEmailWithRecaptcha = functions.https.onRequest((req, res) => {
  // Use CORS to allow requests from web app
  cors(req, res, async () => {
    try {
      const {oobCode, recaptchaToken} = req.body;

      if (!oobCode || !recaptchaToken) {
        return res.status(400).send({error: "Missing parameters."});
      }

      // 1. Verify the reCAPTCHA token with Google
      const recaptchaSecret = functions.config().recaptcha.secret;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

      const response = await axios.post(verificationUrl);
      const {success} = response.data;

      if (!success) {
        console.error("reCAPTCHA verification failed:", response.data);
        return res.status(400).send({error: "reCAPTCHA failed. Please try again."});
      }

      // 2. If reCAPTCHA is valid, apply the email verification code
      await admin.auth().applyActionCode(oobCode);

      return res.status(200).send({message: "Email verified successfully!"});
    } catch (error) {
      console.error("Verification failed:", error);
      if (error.code === "auth/invalid-action-code") {
        return res.status(400).send({error: "This link is invalid or has already been used."});
      }
      return res.status(500).send({error: "An internal error occurred."});
    }
  });
});