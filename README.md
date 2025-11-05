<p align="center">
  <img src="public/images/GitHub_Banner_PM.png" width="640" alt="PantherMarket Logo" />
</p>
<h1 align="center">PantherMarket</h1>
<p align="center">
  <strong>A Georgia State University EXCLUSIVE Marketplace</strong>
  <br />
  <a href="https://www.panthermarket.app/">PantherMarket.app</a>
</p>

PantherMarket is a secure, exclusive buy/sell/trade marketplace built from the ground up for the Georgia State University community. To ensure safety and exclusivity, the platform requires a **two-step user verification process**:
1.  **GSU Email Registration:** Users must register with a valid `@gsu.edu` or `@student.gsu.edu` email address.
2.  **Manual Verification:** After clicking the email link, users must complete a reCAPTCHA challenge on a dedicated verification page, which is validated by a secure backend function.

This project uses a modern single-page application (SPA) architecture, built on vanilla JavaScript, Google Firebase, and Vercel serverless functions.



### 📲 User & Listing Features

* **Full CRUD for Listings:** Verified users can **C**reate, **R**ead, **U**pdate, and **D**elete their own item listings.
* **Comprehensive User Dashboard:** A central hub for users to manage their account, including:
    * **My Listings:** View, edit, delete, and mark listings as sold.
    * **My Orders:** Track purchases and leave reviews for completed transactions.
    * **My Reviews:** See all reviews other users have left for you.
    * **Payments:** Connect and manage your Stripe account.
* **Multi-Image Uploads:** Users can upload up to 4 images for a single listing with an intuitive **drag-and-drop (and touch-compatible)** sorting interface.
* **AI-Powered Suggestions (Gemini):** A "Get AI Suggestions" button analyzes the first uploaded image and uses Google's **Gemini 2.5 Flash** model to automatically generate a compelling title and description.
* **User Review & Rating System:** Buyers can leave a star rating (1-5) and a comment for sellers after a completed order. Average ratings are displayed on user profiles and item detail pages.
* **Real-Time Listing Feed & Search:** The homepage, dashboard, and search results update in real-time as users type or as listings are added, sold, or edited (using Firestore `onSnapshot` listeners).
* **Real-Time Notifications:** A notification bell alerts users in real-time to new sales and new reviews.
* **Dark/Light Mode:** A theme toggle in the header saves the user's preference in `localStorage`.

### 🔒 Security & Payment Features

* **GSU-Exclusive Registration:** Secure sign-up process locked to `@gsu.edu` or `@student.gsu.edu` domains.
* **Two-Step Verification:** Combines Firebase's email link verification with a manual, admin-driven approval process to ensure all users are legitimate.
* **Automated Image Moderation:** All image uploads are automatically scanned by the **Google Cloud Vision API** for inappropriate content (adult, violent) and banned items (e.g., weapons, drugs) *before* they are ever shown to users.
* **Stripe Payments Integration:**
    * **Seller Onboarding:** Sellers can securely connect a Stripe Standard account to receive payments.
    * **On-Platform Checkout:** Buyers can pay directly on-platform with Stripe Checkout.
    * **Automated Webhooks:** A Stripe webhook automatically creates order documents and marks items as "sold" the instant a payment is successful.
* **Secure In-Person Meetup (PIN):** For secure transactions, a seller generates a 5-minute, 6-digit PIN. The buyer must enter this PIN to unlock the payment button, ensuring both parties are physically present before the payment is released.

## 📚 Tech Stack

### Client-Side (Frontend)
* **HTML5:** Main structure served from `index.html`.
* **CSS3:** Custom styling for components, layout, responsiveness, and dark mode.
* **Vanilla JavaScript (ES6+):** All client-side logic, SPA routing, and DOM manipulation are handled in `app.js`.
* **Firebase Client SDK:** Used for Auth, Firestore (real-time), Storage, and invoking Cloud Functions.
* **Stripe.js:** Securely redirects clients to Stripe-hosted Checkout and onboarding pages.

### Backend & Services
* **Firebase Authentication:** Manages user identity, sign-in, and email link verification.
* **Firestore (Database):** NoSQL database for storing `users`, `listings`, `orders`, `reviews`, and `notifications` collections. Used with real-time listeners.
* **Firebase Storage:** Stores all user-uploaded listing images.
* **Firebase Cloud Functions (Node.js):** (Not fully shown in files) The entire server-side backend, handling:
    * **`onCall` Functions:** Secure, callable endpoints for AI suggestions, Stripe actions (creating sessions, checking status), PIN validation, and manual "mark as sold".
    * **`onObjectFinalized` Trigger:** An event-driven function that automatically processes images using **Sharp.js** (for thumbnails) and runs them through the **Cloud Vision API** for moderation.
    * **`onDocumentCreated` Trigger:** Updates a user's average rating whenever a new review is added to the `reviews` collection.
    * **`onRequest` Function:** A public HTTP endpoint that serves as the **Stripe Webhook** to confirm successful payments.
* **Google Cloud (Vertex AI):** Powers AI-generated suggestions using the **Gemini 2.5 Flash** model.
* **Google Cloud (Vision API):** Provides automated image moderation for safety.
* **Stripe Connect & Checkout:** Manages all seller onboarding and on-platform payments.
* **Vercel Serverless Functions:** Hosts Node.js backend logic in the `/api` directory:
    * `/api/config.js`: Securely serves Firebase config and public reCAPTCHA keys to the client.
    * `/api/verify.js`: A secure Node.js endpoint using `firebase-admin` and `axios` to validate reCAPTCHA tokens and finalize the user's manual verification status in Firestore.

## Getting Started

### Prerequisites
* Node.js (for Vercel CLI)
* A Firebase project with **Authentication**, **Firestore**, and **Storage** enabled.
* A Vercel account.
* A **Stripe** account to get API keys.

### Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/gsurjs/panthermarket.git
    cd panthermarket
    ```

2.  **Configure Firebase:**
    * Enable Email/Password sign-in in **Firebase Authentication**.
    * Set up your **Firestore Security Rules** to allow reads on listings and writes/updates/deletes for authenticated owners.
    * Set up your **Firebase Storage Rules** to allow reads and authenticated writes.

3.  **Configure Vercel (Local Development):**
    * Install the Vercel CLI: `npm i -g vercel`
    * Create a `.env` file in the root of the project.
    * Add all your secret keys (from Firebase and reCAPTCHA) to this file. The serverless functions will use them (e.g., `VITE_FIREBASE_API_KEY`, `VITE_RECAPTCHA_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT`).
    * Run the project locally: `vercel dev`

4.  **Configure Vercel (Deployment):**
    * Link your GitHub repository to a new Vercel project.
    * In the Vercel project settings, add all the same environment variables from your `.env` file.
    * Vercel will automatically detect the serverless functions in the `/api` directory and deploy the static content.