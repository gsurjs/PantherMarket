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

const registrationSuccessHTML = `
    <h2>Registration Successful!</h2>
    <p>A verification link has been sent to your GSU email address. Please check your inbox and click the link to activate your account.</p>
`;

//unverified user template that shows if user isn't verified
const verifyEmailHTML = (email) => `
    <h2>Verify Your Email</h2>
    <p>A verification link was sent to <strong>${email}</strong>.</p>
    <p>Please check your inbox and click the link to continue. You will be logged in automatically after verification.</p>
    <button id="resend-verification-button">Resend Verification Email</button>
`;

const welcomeHTML = (user) => `
    <h2>Welcome!</h2>
    <p>You are logged in as ${user.email}.</p>
`;


// --- MAIN APP INITIALIZATION ---
async function initializeApp() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Could not fetch app configuration.');
        }
        const firebaseConfig = await response.json();

        // Initialize Firebase with the fetched config
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Now that Firebase is initialized, set up the auth listener
        setupAuthListener(auth, db);

    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        appContent.innerHTML = `<p class="error">Error: Could not load application. Please try again later.</p>`;
    }
}

// --- AUTHENTICATION STATE LISTENER ---
function setupAuthListener(auth, db) {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, check if their email is verified
            if (user.emailVerified) {
                // User is verified, show the welcome screen
                navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
                appContent.innerHTML = welcomeHTML(user);
                document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
            } else {
                // User is NOT verified, show the verification prompt
                navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
                appContent.innerHTML = verifyEmailHTML(user.email);
                document.getElementById('resend-verification-button').addEventListener('click', () => {
                    user.sendEmailVerification()
                        .then(() => {
                            alert('A new verification email has been sent.');
                        })
                        .catch(error => {
                             document.getElementById('auth-error').textContent = error.message;
                        });
                });
            }
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

// --- FUNCTION TO ADD EVENT LISTENERS TO AUTH FORMS ---
function addAuthFormListeners(auth, db) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authErrorElement = document.getElementById('auth-error');

    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Reload user state to get latest verification status
                    return userCredential.user.reload();
                })
                .catch(error => {
                    authErrorElement.textContent = error.message;
                });
        });
    }

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
                    // Send verification email
                    userCredential.user.sendEmailVerification();
                    // Create user profile in Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        email: userCredential.user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        emailVerified: false
                    });
                })
                .then(() => {
                    // Show success message
                    appContent.innerHTML = registrationSuccessHTML;
                })
                .catch(error => {
                    authErrorElement.textContent = error.message;
                });
        });
    }
}

// --- START THE APP ---
initializeApp();