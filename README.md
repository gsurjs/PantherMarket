# 🐾 PantherMarket

[PantherMarket.app](https://www.panthermarket.app/)

### A Georgia State University EXCLUSIVE Marketplace

PantherMarket is a secure, exclusive buy/sell/trade marketplace built from the ground up for the Georgia State University community. To ensure safety and exclusivity, the platform requires a **two-step user verification process**:
1.  **GSU Email Registration:** Users must register with a valid `@gsu.edu` or `@student.gsu.edu` email address.
2.  **Manual Verification:** After clicking the email link, users must complete a reCAPTCHA challenge on a dedicated verification page, which is validated by a secure backend function.

This project uses a modern single-page application (SPA) architecture, built on vanilla JavaScript, Google Firebase, and Vercel serverless functions.



## Core Features

* **GSU-Exclusive Registration:** Secure sign-up process locked to GSU email domains.
* **Two-Step Email Verification:** A custom verification flow combining a Firebase email link with a reCAPTCHA check to validate human users.
* **Full CRUD for Listings:** Verified users can **C**reate, **R**ead, **U**pdate, and **D**elete their own item listings.
* **Multi-Image Uploads:** Users can upload up to 4 images for a single listing.
* **AI-Powered Suggestions (Gemini):** A "Get AI Suggestions" button on the create listing form analyzes the first uploaded image and uses a Google Cloud Function (powering the `analyzeImage` callable) to provide an AI-generated title and description.
* **Drag-and-Drop Image Sorting:** An intuitive drag-and-drop (and touch-compatible) interface for reordering image previews before uploading.
* **Real-Time Listing Feed:** The homepage and "My Listings" view use real-time listeners (`onSnapshot`) to update instantly when items are added, edited, or deleted.
* **Live Search:** A search bar that filters listings in real-time as the user types, using Firestore `array-contains` queries on title keywords.
* **Detailed Item View:** Clicking a listing opens a full-page view with an image gallery (thumbnails and main image) and owner-specific controls.
* **Client-Side Routing:** The app mimics a multi-page site using `sessionStorage` and JavaScript to render different "views" (Home, My Listings, Item Details) within a single `index.html` page.
* **Dark/Light Mode:** A theme toggle in the header saves the user's preference in `localStorage`.

## Tech Stack

### Client-Side (Frontend)
* **HTML5:** Main structure served from `index.html`.
* **CSS3:** Custom styling for components, layout, responsiveness, and dark mode.
* **Vanilla JavaScript (ES6+):** All client-side logic, SPA routing, and DOM manipulation are handled in `app.js`.

### Backend & Services
* **Firebase Authentication:** Manages user identity, sign-in, and email link verification.
* **Firestore (Database):** NoSQL database for storing `users` and `listings` collections. Used with real-time listeners.
* **Firebase Storage:** Stores all user-uploaded listing images.
* **Firebase Cloud Functions:** (Not fully shown in files) Powers server-side logic for image processing (creating thumbnails) and the `analyzeImage` AI feature.
* **Vercel Serverless Functions:** Hosts Node.js backend logic in the `/api` directory:
    * `/api/config.js`: Securely serves Firebase config and public reCAPTCHA keys to the client.
    * `/api/verify.js`: A secure Node.js endpoint using `firebase-admin` and `axios` to validate reCAPTCHA tokens and finalize the user's manual verification status in Firestore.

## Getting Started

### Prerequisites
* Node.js (for Vercel CLI)
* A Firebase project with **Authentication**, **Firestore**, and **Storage** enabled.
* A Vercel account.

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