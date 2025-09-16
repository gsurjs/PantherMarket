// GET HTML ELEMENTS
const navLinks = document.getElementById('nav-links');
const appContent = document.getElementById('app-content');

// --- TEMPLATES for different views ---
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

const welcomeHTML = (email) => `
    <h2>Welcome!</h2>
    <p>You are logged in as ${email}.</p>
    <p>Please check your inbox to verify your email address.</p>
`;


// --- AUTHENTICATION STATE LISTENER ---
// This is the core of the app. It runs whenever the user's login status changes.
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
        appContent.innerHTML = welcomeHTML(user.email);

        document.getElementById('logout-button').addEventListener('click', () => {
            auth.signOut();
        });

    } else {
        // User is signed out
        navLinks.innerHTML = `
            <a href="#" id="login-link">Login</a>
            <a href="#" id="register-link">Register</a>
        `;
        appContent.innerHTML = loginHTML; // Default to login view
        addAuthFormListeners(); // Re-add listeners for the new forms

        document.getElementById('login-link').addEventListener('click', (e) => {
            e.preventDefault();
            appContent.innerHTML = loginHTML;
            addAuthFormListeners();
        });
        document.getElementById('register-link').addEventListener('click', (e) => {
            e.preventDefault();
            appContent.innerHTML = registerHTML;
            addAuthFormListeners();
        });
    }
});

// --- FUNCTION TO ADD EVENT LISTENERS TO AUTH FORMS ---
function addAuthFormListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authErrorElement = document.getElementById('auth-error');

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

    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            // GSU Email Validation
            const isGsuEmail = email.endsWith('@student.gsu.edu') || email.endsWith('@gsu.edu');
            if (!isGsuEmail) {
                authErrorElement.textContent = 'Error: Please use a valid GSU email address.';
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Create a user document in Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        email: userCredential.user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    console.log('User registered and profile created!');
                })
                .catch(error => {
                    authErrorElement.textContent = error.message;
                });
        });
    }
}