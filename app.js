// --- GET HTML ELEMENTS ---
const navLinks = document.getElementById('nav-links');
const appContent = document.getElementById('app-content');
const listingsGrid = document.getElementById('listings-grid');

// --- HTML TEMPLATES ---
const mainListingsSectionHTML = `
    <h2>Listings</h2>
    <form id="search-form">
        <input type="text" id="search-input" placeholder="Search for items...">
        <button type="submit">Search</button>
    </form>
    <div id="listings-grid">
        </div>
`;

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

// unverified user template that shows if user isn't verified
const verifyEmailHTML = (email) => `
    <h2>Verify Your Email</h2>
    <p>A verification link was sent to <strong>${email}</strong>.</p>
    <p>Please check your inbox and click the link to activate your account. Once verified, you may need to refresh this page.</p>
    <button id="resend-verification-button">Resend Verification Email</button>
    <p id="resend-message" class="error" style="color: green;"></p>
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

const listingCardHTML = (listing, id) => `
    <div class="listing-card" data-id="${id}">
        <img src="${listing.imageUrl}" alt="${listing.title}">
        <div class="listing-card-info">
            <h3>${listing.title}</h3>
            <p>$${listing.price}</p>
            <button class="view-details-btn">View Details</button>
        </div>
    </div>
`;

const itemDetailsHTML = (listing, isOwner) => `
    <div class="item-details">
        <button id="back-to-listings-btn">&larr; Back to Listings</button>
        <h2>${listing.title}</h2>
        <img src="${listing.imageUrl}" alt="${listing.title}">
        <p class="price">$${listing.price}</p>
        <p class="description">${listing.description}</p>
        <p class="seller">Sold by: ${listing.sellerEmail}</p>
        ${isOwner ? `
            <div class="owner-actions">
                <button id="edit-listing-btn">Edit</button>
                <button id="delete-listing-btn">Delete</button>
            </div>
        ` : ''}
    </div>
`;

const editListingHTML = (listing) => `
    <h2>Edit Listing</h2>
    <form id="edit-listing-form">
        <input type="text" id="listing-title" value="${listing.title}" required>
        <textarea id="listing-desc" required>${listing.description}</textarea>
        <input type="number" id="listing-price" value="${listing.price}" step="0.01" required>
        <p><em>To change the image, please delete this listing and create a new one.</em></p>
        <button type="submit">Save Changes</button>
        <button type="button" id="cancel-edit-btn">Cancel</button>
    </form>
    <p id="form-error" class="error"></p>
`;

// Access Denied template
const accessDeniedHTML = `
    <h2>Access Denied</h2>
    <p>You must be a registered and verified GSU user to view listing details.</p>
    <p>Please log in or register to continue.</p>
`;

const myListingsHTML = `
    <h2>My Listings</h2>
    <p>Here are all the items you currently have for sale.</p>
    <div id="my-listings-grid" class="listings-grid">
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
        const storage = firebase.storage();

        // Now that Firebase is initialized, set up the auth listener
        setupAuthListener(auth, db, storage);
        loadAllListings(auth, db, storage);
        setupSearch(auth, db, storage);

    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        appContent.innerHTML = `<p class="error">Error: Could not load application. Please try again later.</p>`;
    }
}

// --- AUTHENTICATION STATE LISTENER ---
function setupAuthListener(auth, db, storage) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Reload the Auth user state
            await user.reload();
            
            // Fetch our custom user profile from Firestore
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get({ source: 'server' });
            const userProfile = userDoc.exists ? userDoc.data() : null;

            // A user is only truly verified if BOTH flags are true.
            const isFullyVerified = user.emailVerified && userProfile?.isManuallyVerified;

            if (isFullyVerified) {
                // --- State 1: User is LOGGED IN and FULLY VERIFIED ---
                document.getElementById('app-content').style.display = 'block';
                document.getElementById('listings-section').style.display = 'block';

                navLinks.innerHTML = `
                    <a href="#" id="home-link">Home</a>
                    <a href="#" id="my-listings-link">My Listings</a>
                    <button id="logout-button">Logout</button>
                `;

                // --- ADD EVENT LISTENERS FOR NAV LINKS & BUTTONS ---
                document.getElementById('logout-button').addEventListener('click', () => {
                    sessionStorage.clear(); // Clear the saved state on logout
                    auth.signOut();
                });

                document.getElementById('home-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.setItem('currentView', 'home'); // Save the state
                    const listingsSection = document.getElementById('listings-section');
                    document.getElementById('app-content').style.display = 'block';

                    listingsSection.style.display = 'block';

                    appContent.innerHTML = welcomeHTML(user);
                    document.getElementById('create-listing-btn').addEventListener('click', () => {
                         appContent.innerHTML = createListingHTML;
                         addListingFormListener(auth, db, storage);
                    });
                    listingsSection.innerHTML = mainListingsSectionHTML;
                    setupSearch(auth, db, storage);
                    loadAllListings(auth, db, storage);
                });

                document.getElementById('my-listings-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.setItem('currentView', 'myListings'); // Save the state
                    renderMyListings(auth, db, storage);
                });

                // --- ROUTING LOGIC: RESTORE VIEW ON PAGE LOAD/REFRESH ---
                const savedView = sessionStorage.getItem('currentView');
                if (savedView === 'myListings') {
                    renderMyListings(auth, db, storage);
                } else if (savedView === 'itemDetails') {
                    const savedItemId = sessionStorage.getItem('currentItemId');
                    if (savedItemId) {
                        showItemDetails(auth, db, storage, savedItemId);
                    } else {
                        // Default to home if ID is missing
                        document.getElementById('home-link').click();
                    }
                } else {
                    // Default to the home view
                    appContent.innerHTML = welcomeHTML(user);
                    document.getElementById('create-listing-btn').addEventListener('click', () => {
                        appContent.innerHTML = createListingHTML;
                        addListingFormListener(auth, db, storage);
                    });
                }
            } else {
                // --- State 2: User is LOGGED IN but NOT FULLY VERIFIED ---
                document.getElementById('app-content').style.display = 'block';
                document.getElementById('listings-section').style.display = 'none';

                navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
                appContent.innerHTML = verifyEmailHTML(user.email);
                addResendListener(auth);

                document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
            }
        
        } else {
            // --- State 3: User is LOGGED OUT ---
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'block';

            navLinks.innerHTML = `
                <a href="#" id="login-link" class="active-link">Login</a>
                <a href="#" id="register-link">Register</a>
            `;
            appContent.innerHTML = loginHTML;

            addAuthFormListeners(auth, db);

            const loginLink = document.getElementById('login-link');
            const registerLink = document.getElementById('register-link');

            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = loginHTML;
                addAuthFormListeners(auth, db);
                loginLink.classList.add('active-link');
                registerLink.classList.remove('active-link');
            });

            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = registerHTML;
                addAuthFormListeners(auth, db);
                registerLink.classList.add('active-link');
                loginLink.classList.remove('active-link');
            });
        }
    });
}

// --- NEW FUNCTION TO HANDLE RESENDING VERIFICATION EMAIL ---
function addResendListener(auth) {
    const resendButton = document.getElementById('resend-verification-button');
    const messageEl = document.getElementById('resend-message');
    
    if (resendButton) {
        resendButton.addEventListener('click', async () => {
            try {
                await auth.currentUser.sendEmailVerification();
                messageEl.textContent = 'A new verification email has been sent!';
                resendButton.disabled = true;
                setTimeout(() => {
                    resendButton.disabled = false;
                    messageEl.textContent = '';
                }, 30000); // Prevent spamming by disabling for 30 seconds
            } catch (error) {
                console.error("Error resending verification email:", error);
                messageEl.style.color = 'red';
                messageEl.textContent = 'Failed to send email. Please try again in a moment.';
            }
        });
    }
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}


// --- FUNCTION TO SETUP SEARCH ---
function setupSearch(auth, db, storage) {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    const debouncedSearch = debounce((searchTerm) => {
        loadAllListings(auth, db, storage, searchTerm);
    }, 500); // 500ms delay after user stops typing

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.trim().toLowerCase();
        loadAllListings(auth, db, storage, searchTerm);
    });

    // Reload all listings when the search bar is cleared by the user
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        if (e.target.value.trim() === '') {
            loadAllListings(auth, db, storage); // Load all listings without a filter
        } else {
            debouncedSearch(searchTerm); // Perform search as user types
        }
    });
}

// --- FUNCTION TO LOAD ALL LISTINGS ---
function loadAllListings(auth, db, storage, searchTerm = '') {
    // Find the grid element here, not globally.
    // This prevents the "stale reference" bug after navigating away and coming back.
    const currentListingsGrid = document.getElementById('listings-grid');
    if (!currentListingsGrid) return; // Safeguard if the grid isn't on the page

    let query;
    const listingsCollection = db.collection("listings");

    if (searchTerm) {
        query = listingsCollection.where("title_tokens", "array-contains", searchTerm.toLowerCase());
    } else {
        query = listingsCollection.orderBy("createdAt", "desc");
    }

    query.onSnapshot((querySnapshot) => {
        currentListingsGrid.innerHTML = ''; // Clear existing listings
        if (querySnapshot.empty) {
            currentListingsGrid.innerHTML = '<p>No listings found.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                currentListingsGrid.innerHTML += listingCardHTML(doc.data(), doc.id);
            });
        }
        addCardEventListeners(auth, db, storage);
    }, (error) => {
        console.error("Error fetching listings:", error);
        currentListingsGrid.innerHTML = '<p class="error">Could not load listings.</p>';
    });
}


// --- FUNCTION TO RENDER ONLY THE CURRENT USER'S LISTINGS ---
async function renderMyListings(auth, db, storage) {
    const user = auth.currentUser;
    if (!user) return; // Exit if no user is logged in

    // Hide the main app content to show our new view
    document.getElementById('app-content').style.display = 'none';
    
    // Use the main listings section for this view
    const listingsSection = document.getElementById('listings-section');
    listingsSection.style.display = 'block';
    listingsSection.innerHTML = myListingsHTML; // Set the page structure
    
    const myGrid = document.getElementById('my-listings-grid');

    // Use onSnapshot for a real-time listener
    db.collection('listings')
        .where('sellerId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((querySnapshot) => {
            // Clear the grid on each update
            myGrid.innerHTML = '';
            
            if (querySnapshot.empty) {
                myGrid.innerHTML = '<p>You have not created any listings yet.</p>';
                return;
            }

            querySnapshot.forEach(doc => {
                myGrid.innerHTML += listingCardHTML(doc.data(), doc.id);
            });

            // Re-attach event listeners to the new cards
            addCardEventListeners(auth, db, storage);

        }, (error) => {
            console.error("Error fetching user's listings:", error);
            myGrid.innerHTML = '<p class="error">Could not load your listings.</p>';
        });
}


// reusable function that renders the details page AND attaches all button listeners.
function showItemDetails(auth, db, storage, listingId) {
    sessionStorage.setItem('currentView', 'itemDetails');
    sessionStorage.setItem('currentItemId', listingId);

    db.collection('listings').doc(listingId).get({ source: 'server' }).then(doc => {
        if (doc.exists) {
            const listingData = doc.data();
            const currentUser = auth.currentUser;
            const isOwner = currentUser && currentUser.uid === listingData.sellerId;

            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'none';
            appContent.innerHTML = itemDetailsHTML(listingData, isOwner);

            document.getElementById('back-to-listings-btn').addEventListener('click', () => {
                const previousView = sessionStorage.getItem('previousView');
                if (previousView === 'myListings') {
                    // If we came from "My Listings", go back there
                    document.getElementById('my-listings-link').click();
                } else {
                    // Otherwise, go back to the Home page
                    document.getElementById('home-link').click();
                }
            });
            
            if (isOwner) {
                document.getElementById('edit-listing-btn').addEventListener('click', () => {
                    appContent.innerHTML = editListingHTML(listingData);
                    addEditFormListener(auth, db, storage, listingId);
                });

                document.getElementById('delete-listing-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this listing?')) {
                        const imageRef = storage.refFromURL(listingData.imageUrl);
                        // handle image deletion errors
                        imageRef.delete().catch(err => console.warn("Image deletion warning:", err));
                        
                        db.collection('listings').doc(listingId).delete().then(() => {
                            alert('Listing deleted successfully.');
                            document.getElementById('home-link').click(); // Go home after deleting
                        }).catch(err => console.error("Error deleting document:", err));
                    }
                });
            }
        } else {
            alert("This listing may have been deleted.");
            document.getElementById('home-link').click();
        }
    }).catch(error => {
        console.error("Error fetching item details:", error);
        alert("Could not load listing details.");
    });
}

// --- FUNCTION TO ADD EDIT FORM LISTENER ---
function addEditFormListener(auth, db, storage, listingId, originalDoc) {
    const editForm = document.getElementById('edit-listing-form');
    const formError = document.getElementById('form-error');

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedTitle = document.getElementById('listing-title').value;
        const updatedDesc = document.getElementById('listing-desc').value;
        const updatedPrice = document.getElementById('listing-price').value;

        // Update the document in Firestore
        db.collection('listings').doc(listingId).update({
            title: updatedTitle,
            description: updatedDesc,
            price: Number(updatedPrice),
            title_lowercase: updatedTitle.toLowerCase(),
            title_tokens: updatedTitle.toLowerCase().split(/\s+/).filter(Boolean)
        }).then(() => {
            alert('Listing updated successfully!');
            showItemDetails(auth, db, storage, listingId);
        }).catch(error => {
            console.error("Error updating document:", error);
            document.getElementById('form-error').textContent = "Failed to update listing.";
        });
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        showItemDetails(auth, db, storage, listingId);
    });
}


// --- FUNCTION TO ADD LISTING FORM LISTENER (UPDATED WITH NEW SECURITY CHECK) ---
function addListingFormListener(auth, db, storage) {
    const listingForm = document.getElementById('create-listing-form');
    const user = auth.currentUser;

    // Get all the new/modified elements
    const formError = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-listing-btn');
    const cancelBtn = document.getElementById('cancel-listing-btn');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressLabel = document.getElementById('progress-label');

    listingForm.addEventListener('submit', async (e) => { // Make the event listener async
        e.preventDefault();

        // -- NEW, ROBUST SECURITY CHECK --
        // check for the custom Firestore flag here as well.
        if (!user) return; // Should not happen, but a safeguard edge case

        try {
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get({ source: 'server' });
            const isFullyVerified = user.emailVerified && userDoc.exists && userDoc.data().isManuallyVerified;

            if (!isFullyVerified) {
                formError.textContent = "Error: You must be a fully verified user to create a listing.";
                return; // Stop the function if not fully verified
            }
        } catch (error) {
            console.error("Verification check failed:", error);
            formError.textContent = "Error: Could not confirm user verification status.";
            return;
        }

        // --- If the check passes, the rest of the function proceeds as normal ---
        const title = document.getElementById('listing-title').value;
        const description = document.getElementById('listing-desc').value;
        const price = document.getElementById('listing-price').value;
        const imageFile = document.getElementById('listing-image').files[0];

        if (!imageFile) {
            formError.textContent = "Please select an image.";
            return;
        }

        // --- START UPLOAD PROCESS ---
        // Disable buttons and show the progress bar
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        progressContainer.style.display = 'block';
        formError.textContent = '';

        // 1. Upload Image to Firebase Storage
        const filePath = `listings/${user.uid}/${Date.now()}_${imageFile.name}`;
        const fileRef = storage.ref(filePath);
        const uploadTask = fileRef.put(imageFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                // --- UPDATE PROGRESS BAR ---
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.value = progress;
                progressLabel.textContent = `Uploading... ${Math.round(progress)}%`;
            },
            (error) => {
                // --- HANDLE ERRORS ---
                console.error("Upload failed:", error);
                formError.textContent = "Image upload failed. Please try again.";
                // Re-enable buttons and hide progress bar on failure
                submitBtn.disabled = false;
                cancelBtn.disabled = false;
                progressContainer.style.display = 'none';
            },
            () => {
                // --- HANDLE SUCCESS ---
                progressLabel.textContent = 'Processing...'; // Feedback for the final step

                // 2. Get Image URL after upload
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // 3. Save Listing to Firestore
                    db.collection("listings").add({
                        title: title,
                        title_lowercase: title.toLowerCase(),
                        title_tokens: title.toLowerCase().split(/\s+/).filter(Boolean),
                        description: description,
                        price: Number(price),
                        imageUrl: downloadURL,
                        sellerId: user.uid,
                        sellerEmail: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        alert('Listing created successfully!');
                        // Go back to welcome screen
                        appContent.innerHTML = welcomeHTML(user); 
                        document.getElementById('create-listing-btn').addEventListener('click', () => {
                            appContent.innerHTML = createListingHTML;
                            addListingFormListener(auth, db, storage);
                        });
                        // Refresh listings on the main page
                        loadAllListings(auth, db, storage); 
                    }).catch(error => {
                        console.error("Error adding document: ", error);
                        formError.textContent = "Failed to save listing.";
                        // Re-enable buttons and hide progress on failure
                        submitBtn.disabled = false;
                        cancelBtn.disabled = false;
                        progressContainer.style.display = 'none';                    
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
// --FUNCTION FOR FETCHING SPECIFIC LISTING DATA FROM FIRESTORE TO DISPLAY--
function addCardEventListeners(auth, db, storage) {
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', async (e) => { // Make async
            const currentUser = auth.currentUser;
            const card = e.target.closest('.listing-card');
            const listingId = card.dataset.id;

            // first check if user is lgoged out
            if (!currentUser) {
                alert('You must be logged-in and verified to view details.');
                return; // Stop the function here
            }

            // Use our robust, dual-flag verification check
            const userDocRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userDocRef.get({ source: 'server' });
            const isFullyVerified = currentUser.emailVerified && userDoc.exists && userDoc.data().isManuallyVerified;

            if (currentUser && isFullyVerified) {
                // NEW: Save the previous view so the "Back" button knows where to go
                const currentView = sessionStorage.getItem('currentView') || 'home';
                sessionStorage.setItem('previousView', currentView);

                // This function should ONLY call showItemDetails.
                // All the duplicate code that was here has been removed.
                showItemDetails(auth, db, storage, listingId);
            } else {
                alert('You must be logged-in and verified to view details.');
            }
        });
    });
}


// --- FUNCTION TO ADD EVENT LISTENERS TO AUTH FORMS ---
function addAuthFormListeners(auth, db) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authErrorElement = document.getElementById('auth-error');

    if (registerForm) {
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            // GSU email validation remains the same
            if (!email.endsWith('@student.gsu.edu') && !email.endsWith('@gsu.edu')) {
                authErrorElement.textContent = 'Error: Please use a valid GSU email address.';
                return;
            }

            authErrorElement.textContent = '';

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);

                // manually triggers init verification email upon registration
                await userCredential.user.sendEmailVerification();

                // You can still create a user profile in Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: userCredential.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isManuallyVerified: false
                });
                
                // The onAuthStateChanged listener will now automatically show the
                // 'verifyEmailHTML' view for the new, unverified user.
            } catch (error) {
                authErrorElement.textContent = error.message;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            authErrorElement.textContent = '';

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // The onAuthStateChanged listener will handle the redirect.
            } catch (error) {
                authErrorElement.textContent = error.message;
            }
        });
    }
}

// --- THEME TOGGLE LOGIC ---
function setupTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    // Function to apply the theme
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️'; // Sun icon
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙'; // Moon icon
        }
    };

    // Check localStorage for a saved theme when the page loads
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Add click event listener to the button
    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        
        // Save the new theme to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Apply the new theme to the page
        applyTheme(newTheme);
    });
}

// --- START THE APP ---
initializeApp();
setupTheme();