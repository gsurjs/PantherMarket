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
        <label for="listing-image">Upload Images (Up to 4):</label>
        <input type="file" id="listing-image" accept="image/*" multiple required>

        <div id="image-preview-container"></div>

        <button type="submit" id="submit-listing-btn">Submit Listing</button>
        <button type="button" id="cancel-listing-btn">Cancel</button>
    </form>
    <div id="upload-progress-container" style="display: none;">
        <p id="progress-label">Uploading...</p>
        <progress id="upload-progress-bar" value="0" max="100"></progress>
    </div>
    <p id="form-error" class="error"></p>
`;

const listingCardHTML = (listing, id) => `
    <div class="listing-card" data-id="${id}">
        <img src="${(listing.imageUrls && listing.imageUrls[0]) || listing.imageUrl}" alt="${listing.title}">
        <div class="listing-card-info">
            <h3>${listing.title}</h3>
            <p>$${listing.price}</p>
            <button class="view-details-btn">View Details</button>
        </div>
    </div>
`;

const itemDetailsHTML = (listing, isOwner) => {
    // This line creates an array of images, whether the source is a single URL or an array of URLs.
    const images = listing.imageUrls || [listing.imageUrl];

    return `
    <div class="item-details">
        <button id="back-to-listings-btn">&larr; Back to Listings</button>
        <h2>${listing.title}</h2>
        <div class="image-gallery">
            <div class="main-image-container">
                <img id="main-gallery-image" src="${images[0]}" alt="${listing.title}">
            </div>
            ${images.length > 1 ? `
                <div class="thumbnail-container">
                    ${images.map((url, index) => `
                        <img src="${url}" alt="Thumbnail ${index + 1}" class="thumbnail-image ${index === 0 ? 'active' : ''}">
                    `).join('')}
                </div>
            ` : ''}
        </div>
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
};

const editListingHTML = (listing) => `
    <h2>Edit Listing</h2>
    <form id="edit-listing-form">
        <input type="text" id="listing-title" value="${listing.title}" required>
        <textarea id="listing-desc" required>${listing.description}</textarea>
        <input type="number" id="listing-price" value="${listing.price}" step="0.01" required>
        <p><em>To change images, please delete this listing and create a new one.</em></p>
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

function renderWelcomeView(user, auth, db, storage) {
    appContent.innerHTML = welcomeHTML(user);
    document.getElementById('create-listing-btn').addEventListener('click', () => {
        appContent.innerHTML = createListingHTML;
        addListingFormListener(auth, db, storage);
    });
}


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

                    renderWelcomeView(user, auth, db, storage);

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
                        renderWelcomeView(user, auth, db, storage);
                    }
                } else {
                    // Default to the home view
                    // Default to the home view
                    renderWelcomeView(user, auth, db, storage);
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
            // The updated itemDetailsHTML function is now called here
            appContent.innerHTML = itemDetailsHTML(listingData, isOwner);

            const mainImage = document.getElementById('main-gallery-image');
            if (mainImage) {
                 const thumbnails = document.querySelectorAll('.thumbnail-image');
                 thumbnails.forEach(thumbnail => {
                    thumbnail.addEventListener('click', () => {
                        mainImage.src = thumbnail.src;
                        thumbnails.forEach(t => t.classList.remove('active'));
                        thumbnail.classList.add('active');
                    });
                });
            }

            document.getElementById('back-to-listings-btn').addEventListener('click', () => {
                const previousView = sessionStorage.getItem('previousView');
                if (previousView === 'myListings') {
                    document.getElementById('my-listings-link').click();
                } else {
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
                        // This line ensures the delete logic works for BOTH old and new listings.
                        const imagesToDelete = listingData.imageUrls || [listingData.imageUrl];
                        
                        const deletePromises = imagesToDelete.map(url => {
                            // A check to prevent errors if a URL is somehow invalid
                            if (url) return storage.refFromURL(url).delete();
                            return Promise.resolve(); // Return a resolved promise for invalid URLs
                        });

                        Promise.allSettled(deletePromises)
                            .then(results => {
                                results.forEach((result, index) => {
                                    if (result.status === 'rejected') {
                                        console.warn(`Failed to delete image ${index + 1}:`, result.reason);
                                    }
                                });
                                // Then, delete the Firestore document
                                db.collection('listings').doc(listingId).delete().then(() => {
                                    alert('Listing deleted successfully.');
                                    document.getElementById('home-link').click();
                                }).catch(err => {
                                    console.error("Error deleting document:", err)
                                    alert("Could not delete listing data. Please try again.");
                                });
                            });
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


// --- FUNCTION TO ADD LISTING FORM LISTENER ---
function addListingFormListener(auth, db, storage) {
    const listingForm = document.getElementById('create-listing-form');
    if (!listingForm) return;
    const user = auth.currentUser;

    const formError = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-listing-btn');
    const cancelBtn = document.getElementById('cancel-listing-btn');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressLabel = document.getElementById('progress-label');
    const imageInput = document.getElementById('listing-image');
    const previewContainer = document.getElementById('image-preview-container');

    // Array to store all selected files for upload.
    let filesToUpload = [];

    // Helper function to render the previews
    const renderPreviews = () => {
        previewContainer.innerHTML = '';
        filesToUpload.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewWrapper = document.createElement('div');
                previewWrapper.classList.add('preview-wrapper');

                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-thumbnail');

                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-preview-btn');
                removeBtn.textContent = 'X';
                removeBtn.type = 'button';
                removeBtn.onclick = () => {
                    filesToUpload.splice(index, 1);
                    renderPreviews();
                };

                previewWrapper.appendChild(img);
                previewWrapper.appendChild(removeBtn);
                previewContainer.insertBefore(previewWrapper, previewContainer.firstChild);
            };
            reader.readAsDataURL(file);
        });
    };

    imageInput.addEventListener('change', (event) => {
        formError.textContent = '';
        const newFiles = Array.from(event.target.files);

        for (const file of newFiles) {
            if (filesToUpload.length < 4) {
                filesToUpload.push(file);
            } else {
                formError.textContent = "You can only select a maximum of 4 images.";
                break;
            }
        }
        
        renderPreviews();
        imageInput.value = '';
    });

    listingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!user) return;
        try {
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get({ source: 'server' });
            const isFullyVerified = user.emailVerified && userDoc.exists && userDoc.data().isManuallyVerified;

            if (!isFullyVerified) {
                formError.textContent = "Error: You must be a fully verified user to create a listing.";
                return;
            }
        } catch (error) {
            console.error("Verification check failed:", error);
            formError.textContent = "Error: Could not confirm user verification status.";
            return;
        }

        const title = document.getElementById('listing-title').value;
        const description = document.getElementById('listing-desc').value;
        const price = document.getElementById('listing-price').value;
        
        const imageFiles = filesToUpload;

        if (!imageFiles || imageFiles.length === 0) {
            formError.textContent = "Please select at least one image.";
            return;
        }
        if (imageFiles.length > 4) {
            formError.textContent = "You can only upload a maximum of 4 images.";
            return;
        }

        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        progressContainer.style.display = 'block';
        formError.textContent = '';

        const uploadPromises = imageFiles.map((file, index) => {
            const filePath = `listings/${user.uid}/${Date.now()}_${file.name}`;
            const fileRef = storage.ref(filePath);
            const uploadTask = fileRef.put(file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressBar.value = progress;
                        progressLabel.textContent = `Uploading image ${index + 1} of ${imageFiles.length}... ${Math.round(progress)}%`;
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        reject(error);
                    },
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then(resolve).catch(reject);
                    }
                );
            });
        });

        try {
            const downloadURLs = await Promise.all(uploadPromises);

            await db.collection("listings").add({
                title: title,
                title_lowercase: title.toLowerCase(),
                title_tokens: title.toLowerCase().split(/\s+/).filter(Boolean),
                description: description,
                price: Number(price),
                imageUrls: downloadURLs,
                sellerId: user.uid,
                sellerEmail: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Listing created successfully!');
            document.getElementById('home-link').click();

        } catch (error) {
            formError.textContent = "An image failed to upload. Please try again.";
            submitBtn.disabled = false;
            cancelBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });
    
    // This is the updated section as requested.
    // It now correctly calls the new helper function, preventing duplicate event listeners.
    cancelBtn.addEventListener('click', () => {
        renderWelcomeView(user, auth, db, storage);
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