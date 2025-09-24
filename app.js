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

// unverified user template that shows if user isn't verified
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
    auth.onAuthStateChanged(user => {
        // --- State 1: User is LOGGED IN and VERIFIED ---
        if (user && user.emailVerified) {
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'block';
            
            navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
            appContent.innerHTML = welcomeHTML(user);

            document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
            document.getElementById('create-listing-btn').addEventListener('click', () => {
                appContent.innerHTML = createListingHTML;
                addListingFormListener(auth, db, storage);
            });
        
        // --- State 2: User is LOGGED IN but NOT VERIFIED ---
        } else if (user && !user.emailVerified) {
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'block';

            navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
            appContent.innerHTML = verifyEmailHTML(user.email); 
            
            document.getElementById('resend-verification-button').addEventListener('click', () => {
                user.sendEmailVerification().then(() => alert('Verification email sent!'));
            });
            document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
        
        // --- State 3: User is LOGGED OUT ---
        } else {
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'block';

            // Set the nav links for login and register
            navLinks.innerHTML = `
                <a href="#" id="login-link" class="active-link">Login</a>
                <a href="#" id="register-link">Register</a>
            `;

            // Show the login form by default
            appContent.innerHTML = loginHTML;

            // Make the login/register forms and nav links work
            addAuthFormListeners(auth, db);

            const loginLink = document.getElementById('login-link');
            const registerLink = document.getElementById('register-link');

            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = loginHTML;
                addAuthFormListeners(auth, db); // Re-attach listeners to the new form
                loginLink.classList.add('active-link');
                registerLink.classList.remove('active-link');
            });

            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                appContent.innerHTML = registerHTML;
                addAuthFormListeners(auth, db); // Re-attach listeners to the new form
                registerLink.classList.add('active-link');
                loginLink.classList.remove('active-link');
            });
        }
    });
}

// --- FUNCTION TO SETUP SEARCH ---
function setupSearch(auth, db, storage) {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        loadAllListings(auth, db, storage, searchTerm);
    });

    // Reload all listings when the search bar is cleared by the user
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            loadAllListings(auth, db, storage); // Load all listings without a filter
        }
    });
}

// --- FUNCTION TO LOAD ALL LISTINGS ---
function loadAllListings(auth, db, storage, searchTerm = '') {
    let query;
    const listingsCollection = db.collection("listings");

    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        // Query for titles that start with the search term (case-insensitive).
        // Firestore requires ordering by the same field you are filtering on with a range.
        // This means search results will be alphabetical, not by creation date.
        query = listingsCollection.orderBy("title_lowercase")
                                  .startAt(lowerCaseSearchTerm)
                                  .endAt(lowerCaseSearchTerm + '\uf8ff');
    } else {
        // Default query: get all listings, ordered by most recent
        query = listingsCollection.orderBy("createdAt", "desc");
    }

    query.onSnapshot((querySnapshot) => {
        listingsGrid.innerHTML = ''; // Clear existing listings
        if (querySnapshot.empty) {
            listingsGrid.innerHTML = '<p>No listings found.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                listingsGrid.innerHTML += listingCardHTML(doc.data(), doc.id);
            });
        }
        // after all cards are on page, add listeners to their respective buttons
        addCardEventListeners(auth, db, storage);
    }, (error) => {
        console.error("Error fetching listings:", error);
        listingsGrid.innerHTML = '<p class="error">Could not load listings.</p>';
    });
}

// reusable function that renders the details page AND attaches all button listeners.
function showItemDetails(auth, db, storage, listingId) {
    db.collection('listings').doc(listingId).get().then(doc => {
        if (doc.exists) {
            const listingData = doc.data();
            const currentUser = auth.currentUser;
            const isOwner = currentUser && currentUser.uid === listingData.sellerId;

            // Show the details view
            document.getElementById('listings-section').style.display = 'none';
            appContent.innerHTML = itemDetailsHTML(listingData, isOwner);

            // --- Attach Listeners ---
            // Listener for the "Back" button
            document.getElementById('back-to-listings-btn').addEventListener('click', () => {
                document.getElementById('listings-section').style.display = 'block';
                appContent.innerHTML = welcomeHTML(currentUser);
                document.getElementById('create-listing-btn').addEventListener('click', () => {
                   appContent.innerHTML = createListingHTML;
                   addListingFormListener(auth, db, storage);
                });
            });

            // If the user is the owner, add listeners for Edit and Delete buttons
            if (isOwner) {
                document.getElementById('edit-listing-btn').addEventListener('click', () => {
                    appContent.innerHTML = editListingHTML(listingData);
                    addEditFormListener(auth, db, storage, listingId);
                });

                document.getElementById('delete-listing-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this listing?')) {
                        const imageRef = storage.refFromURL(listingData.imageUrl);
                        imageRef.delete().then(() => {
                            db.collection('listings').doc(listingId).delete().then(() => {
                                alert('Listing deleted successfully.');
                                document.getElementById('listings-section').style.display = 'block';
                                appContent.innerHTML = welcomeHTML(currentUser);
                                 document.getElementById('create-listing-btn').addEventListener('click', () => {
                                    appContent.innerHTML = createListingHTML;
                                    addListingFormListener(auth, db, storage);
                                });
                            });
                        });
                    }
                });
            }
        } else {
            console.error("No such document!");
            alert("This listing may have been deleted.");
        }
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
            title_lowercase: updatedTitle.toLowerCase()
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


// --- FUNCTION TO ADD LISTING FORM LISTENER ---
function addListingFormListener(auth, db, storage) {
    const listingForm = document.getElementById('create-listing-form');
    const formError = document.getElementById('form-error');
    const user = auth.currentUser;

    listingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // -- Security Check for User Verification --

        if (!user || !user.emailVerified) {
            formError.textContent = "Error: You must have a verified email to create a listing.";
            return; // Stop the function from proceeding
        }

        const title = document.getElementById('listing-title').value;
        const description = document.getElementById('listing-desc').value;
        const price = document.getElementById('listing-price').value;
        const imageFile = document.getElementById('listing-image').files[0];

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
                        title_lowercase: title.toLowerCase(),
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
                        	loadAllListings(auth, db, storage); // Refresh listings on the page
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

// --FUNCTION FOR FETCHING SPECIFIC LISTING DATA FROM FIRESTORE TO DISPLAY--
function addCardEventListeners(auth, db, storage) {
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const currentUser = auth.currentUser;
            
            // Security Check: User must be logged in AND verified to view details.
            if (currentUser && currentUser.emailVerified) {
                const card = e.target.closest('.listing-card');
                const listingId = card.dataset.id;

                db.collection('listings').doc(listingId).get().then(doc => {
                    if (doc.exists) {
                        const listingData = doc.data();
                        const isOwner = currentUser.uid === listingData.sellerId;

                        // Show the item details page
                        document.getElementById('listings-section').style.display = 'none';
                        appContent.innerHTML = itemDetailsHTML(listingData, isOwner);

                        // Make the "Back to Listings" button work
                        document.getElementById('back-to-listings-btn').addEventListener('click', () => {
                            document.getElementById('listings-section').style.display = 'block';
                            // Show the welcome screen again for the logged-in user
                            appContent.innerHTML = welcomeHTML(currentUser);
                            // Re-attach the listener for the "Create Listing" button
                            document.getElementById('create-listing-btn').addEventListener('click', () => {
                               appContent.innerHTML = createListingHTML;
                               addListingFormListener(auth, db, storage);
                            });
                        });
                        
                        // If the user owns the listing, make the Edit/Delete buttons work
                        if (isOwner) {
                            document.getElementById('delete-listing-btn').addEventListener('click', () => {
                                if (confirm('Are you sure you want to delete this listing?')) {
                                    const imageRef = storage.refFromURL(listingData.imageUrl);
                                    imageRef.delete().then(() => {
                                        db.collection('listings').doc(listingId).delete().then(() => {
                                            alert('Listing deleted successfully.');
                                            document.getElementById('listings-section').style.display = 'block';
                                            appContent.innerHTML = welcomeHTML(currentUser);
                                            document.getElementById('create-listing-btn').addEventListener('click', () => {
                                                appContent.innerHTML = createListingHTML;
                                                addListingFormListener(auth, db, storage);
                                            });
                                        }).catch(error => console.error("Error deleting document: ", error));
                                    }).catch(error => console.error("Error deleting image: ", error));
                                }
                            });

                            document.getElementById('edit-listing-btn').addEventListener('click', () => {
                                appContent.innerHTML = editListingHTML(listingData);
                                addEditFormListener(auth, db, storage, listingId, doc);
                            });
                        }
                    } else {
                        console.error("Error: No such document!");
                        alert("Sorry, this listing could not be found.");
                    }
                }).catch(error => {
                    console.error("Error getting document:", error);
                });

            } else {
                // If user is logged out or not verified, show the access denied pop up instead
                alert('You must be logged-in and verified to view details.\n\nPlease log in or register.');
            }
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