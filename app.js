// --- GET HTML ELEMENTS ---
const navLinks = document.getElementById('nav-links');
const appContent = document.getElementById('app-content');
const listingsGrid = document.getElementById('listings-grid');

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
    <p>If you've clicked the link in your email and haven't been redirected, try refreshing this page.</p>
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
    <button id="create-listing-btn">Create a New Listing</button>
`;

const createListingHTML = `
    <h2>Create New Listing</h2>
    <form id="create-listing-form">
        <input type="text" id="listing-title" placeholder="Item Title" required>
        <textarea id="listing-desc" placeholder="Item Description" required></textarea>
        <input type="number" id="listing-price" placeholder="Price ($)" step="0.01" required>
        <label for="listing-image">Upload Image:</label>
        <input type="file" id="listing-image" accept="image/*" required>
        <button type="submit">Submit Listing</button>
        <button type="button" id="cancel-listing-btn">Cancel</button>
    </form>
    <p id="form-error" class="error"></p>
`;

const listingCardHTML = (listing) => `
    <div class="listing-card">
        <img src="${listing.imageUrl}" alt="${listing.title}">
        <div class="listing-card-info">
            <h3>${listing.title}</h3>
            <p>$${listing.price}</p>
        </div>
    </div>
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
function setupAuthListener(auth, db, storage) {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, check if their email is verified
            if (user.emailVerified) {
                // User is verified, show the welcome screen
                navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
                appContent.innerHTML = welcomeHTML(user);
                document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
                document.getElementById('create-listing-btn').addEventListener('click', () => {
	                appContent.innerHTML = createListingHTML;
	                addListingFormListener(auth, db, storage);
            	});
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

// --- FUNCTION TO LOAD ALL LISTINGS ---
function loadAllListings(db) {
    db.collection("listings").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        listingsGrid.innerHTML = ''; // Clear existing listings
        querySnapshot.forEach((doc) => {
            listingsGrid.innerHTML += listingCardHTML(doc.data());
        });
    });
}


// --- FUNCTION TO ADD LISTING FORM LISTENER ---
function addListingFormListener(auth, db, storage) {
    const listingForm = document.getElementById('create-listing-form');
    const formError = document.getElementById('form-error');

    listingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('listing-title').value;
        const description = document.getElementById('listing-desc').value;
        const price = document.getElementById('listing-price').value;
        const imageFile = document.getElementById('listing-image').files[0];
        const user = auth.currentUser;

        if (!imageFile) {
            formError.textContent = "Please select an image.";
            return;
        }

        // 1. Upload Image to Firebase Storage
        const filePath = `listings/${user.uid}/${Date.now()}_${imageFile.name}`;
        const fileRef = storage.ref(filePath);
        const uploadTask = fileRef.put(imageFile);

        uploadTask.on('state_changed',
            (snapshot) => { /* Can be used for upload progress bar */ },
            (error) => {
                console.error("Upload failed:", error);
                formError.textContent = "Image upload failed. Please try again.";
            },
            () => {
                // 2. Get Image URL after upload
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // 3. Save Listing to Firestore
                    db.collection("listings").add({
                        title: title,
                        description: description,
                        price: Number(price),
                        imageUrl: downloadURL,
                        sellerId: user.uid,
                        sellerEmail: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        alert('Listing created successfully!');
                        appContent.innerHTML = welcomeHTML(user); // Go back to welcome screen
                        document.getElementById('create-listing-btn').addEventListener('click', () => {
                            appContent.innerHTML = createListingHTML;
                            addListingFormListener(auth, db, storage);
                        	loadAllListings(db); // Refresh listings on the page
                        });
                    }).catch(error => {
                        console.error("Error adding document: ", error);
                        formError.textContent = "Failed to save listing.";
                    });
                });
            }
        );
    });
    document.getElementById('cancel-listing-btn').addEventListener('click', () => {
        appContent.innerHTML = welcomeHTML(user);
        // Re-attach the listener for the create button after returning to the welcome screen
        document.getElementById('create-listing-btn').addEventListener('click', () => {
            appContent.innerHTML = createListingHTML;
            addListingFormListener(auth, db, storage);
        });
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