// --- GET HTML ELEMENTS ---
const navLinks = document.getElementById('nav-links');
const appContent = document.getElementById('app-content');

// --- HTML TEMPLATES ---
const loginHTML = `
    <h2>Login</h2>
    <form id="login-form">
        <input type="email" id="login-email" placeholder="GSU Email" required>
        <input type="password" id="login-password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
    <p id="auth-error" class="error"></p>
`;

const registerHTML = `
    <h2>Register</h2>
    <form id="register-form">
        <input type="email" id="register-email" placeholder="GSU Email" required>
        <input type="password" id="register-password" placeholder="Password" required>
        <button type="submit">Register</button>
    </form>
    <p id="auth-error" class="error"></p>
`;

const welcomeHTML = (user) => `
    <h2>Welcome!</h2>
    <p>You are logged in as ${user.email}.</p>
`;

// --- MAIN APP LOGIC ---

// This function will fetch the config and then start the rest of the app
async function initializeApp() {
    try {
        // 1. Fetch the Firebase config from our secure API endpoint
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Could not fetch app configuration.');
        }
        const firebaseConfig = await response.json();

        // 2. Initialize Firebase with the fetched config
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // 3. Now that Firebase is initialized, set up the auth listener
        setupAuthListener(auth, db);

    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        appContent.innerHTML = `<p class="error">Error: Could not load application. Please try again later.</p>`;
    }
}

// This function sets up the main listener and is only called once Firebase is ready
function setupAuthListener(auth, db) {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
            appContent.innerHTML = welcomeHTML(user);
            document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
        } else {
            // User is signed out
            navLinks.innerHTML = `
                <a href="#" id="login-link">Login</a>
                <a href="#" id="register-link">Register</a>
            `;
            appContent.innerHTML = loginHTML;
            addAuthFormListeners(auth, db);

            document.getElementById('login-link').addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = loginHTML;
                addAuthFormListeners(auth, db);
            });
            document.getElementById('register-link').addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = registerHTML;
                addAuthFormListeners(auth, db);
            });
        }
    });
}

// This function adds listeners to the forms
function addAuthFormListeners(auth, db) {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const authErrorElement = document.getElementById('auth-error');

    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            const isGsuEmail = email.endsWith('@student.gsu.edu') || email.endsWith('@gsu.edu');
            if (!isGsuEmail) {
                authErrorElement.textContent = 'Error: Please use a valid GSU email address.';
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    return db.collection('users').doc(userCredential.user.uid).set({
                        email: userCredential.user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .catch(error => {
                    authErrorElement.textContent = error.message;
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => {
                    authErrorElement.textContent = error.message;
                });
        });
    }
}

// --- START THE APP ---
initializeApp();