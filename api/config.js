export default function handler(req, res) {
  res.status(200).json({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    recaptchaSiteKey: process.env.VITE_RECAPTCHA_SITE_KEY,
    recaptchaKeyV3: process.env.VITE_RECAPTCHA_V3_SITE_KEY,
  });
}