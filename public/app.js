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

        <div id="analysis-progress-container" style="display: none;">
            <p id="analysis-progress-label">Analyzing...</p>
            <progress id="analysis-progress-bar" value="0" max="100"></progress>
        </div>

        <button type="button" id="analyze-image-btn" class="ai-button" disabled>✨ Get AI Suggestions</button>
        <p id="ai-status" class="form-status"></p>

        <div id="ai-progress-container" style="display: none;">
            <progress id="ai-progress-bar" class="ai-progress"></progress>
        </div>

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

const listingCardHTML = (listing, id) => {
    if (listing.status !== 'active') return '';

    let imageUrl = "https://via.placeholder.com/400x400.png?text=No+Image";
    if (listing.processedImages && listing.processedImages.length > 0 && listing.processedImages[0].thumb) {
        imageUrl = listing.processedImages[0].thumb;
    }

    return `
    <div class="listing-card" data-id="${id}">
        <img src="${imageUrl}" alt="${listing.title}">
        <div class="listing-card-info">
            <h3>${listing.title}</h3>
            <p>$${listing.price}</p>
            <button class="view-details-btn">View Details</button>
        </div>
    </div>
    `;
};

const itemDetailsHTML = (listing, isOwner) => {
    let images = ["https://via.placeholder.com/1280x1280.png?text=No+Image"];
    
    if (listing.processedImages && listing.processedImages.length > 0) {
        // Maps over the images, then filters out any undefined or null URLs
        const validImages = listing.processedImages.map(img => img.large).filter(Boolean);

        if (validImages.length > 0) {
            images = validImages;
        }
    }

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
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            // get verification state before reloading
            const wasEmailVerified = currentUser.emailVerified;

            // reload auth user state
            await currentUser.reload();

            // Get verification state after reloading
            const isNowEmailVerified = currentUser.emailVerified

            let tokenResult;

            // bug fix, force refresh token before doing anything else
            if (isNowEmailVerified && !wasEmailVerified) {
                tokenResult = await currentUser.getIdTokenResult(true); 
            } else {
                tokenResult = await currentUser.getIdTokenResult(false);
            }


            const isFullyVerified = tokenResult.claims.email_verified === true &&
                                    tokenResult.claims.manuallyVerified === true;

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
                        // Default to home if ID is missing by programmatically clicking the link
                        document.getElementById('home-link').click();
                    }
                } else {
                    // Default to the home view
                    renderWelcomeView(currentUser, auth, db, storage);
                }
            } else {
                // --- State 2: User is LOGGED IN but NOT FULLY VERIFIED ---
                document.getElementById('app-content').style.display = 'block';
                document.getElementById('listings-section').style.display = 'none';

                navLinks.innerHTML = `<button id="logout-button">Logout</button>`;
                appContent.innerHTML = verifyEmailHTML(currentUser.email);
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
            const thumbnails = document.querySelectorAll('.thumbnail-image');
            
            thumbnails.forEach(thumbnail => {
                thumbnail.addEventListener('click', () => {
                    // Update the main image source
                    mainImage.src = thumbnail.src;
                    
                    // Update the 'active' class for styling
                    thumbnails.forEach(t => t.classList.remove('active'));
                    thumbnail.classList.add('active');
                });
            });

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
                        // Updated delete logic to handle all data structures
                        let imagesToDelete = [];
                        
                        // Handle new processedImages structure
                        if (listingData.processedImages && listingData.processedImages.length > 0) {
                            // For new structure, we need to delete both thumb and large versions
                            listingData.processedImages.forEach(img => {
                                if (img.thumb) imagesToDelete.push(img.thumb);
                                if (img.large) imagesToDelete.push(img.large);
                            });
                        } else if (listingData.processedImageUrls) {
                            // Handle old single processed image structure
                            if (listingData.processedImageUrls.thumb) imagesToDelete.push(listingData.processedImageUrls.thumb);
                            if (listingData.processedImageUrls.large) imagesToDelete.push(listingData.processedImageUrls.large);
                        } else if (listingData.imageUrls) {
                            // Handle old multi-image array
                            imagesToDelete = listingData.imageUrls;
                        } else if (listingData.imageUrl) {
                            // Handle very old single image
                            imagesToDelete = [listingData.imageUrl];
                        }
                        
                        const deletePromises = imagesToDelete.map(url => {
                            if (url) {
                                return storage.refFromURL(url).delete().catch(err => {
                                    console.warn(`Failed to delete image: ${err.message}`);
                                    return Promise.resolve(); // Continue even if image deletion fails
                                });
                            }
                            return Promise.resolve();
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
                                    console.error("Error deleting document:", err);
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

    // --- AI button and status elements ---
    const analyzeBtn = document.getElementById('analyze-image-btn');
    const aiStatus = document.getElementById('ai-status');

    // --- AI analysis progress bar elements ---
    const analysisProgressContainer = document.getElementById('analysis-progress-container');
    const analysisProgressBar = document.getElementById('analysis-progress-bar');
    const analysisProgressLabel = document.getElementById('analysis-progress-label');

    const aiProgressContainer = document.getElementById('ai-progress-container');

    // Array to store all selected files for upload.
    let filesToUpload = [];

    // Variables for drag and drop
    let draggedIndex = null;
    let touchItem = null;
    let touchOffset = { x: 0, y: 0 };

    async function validateImageSafety(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Image = reader.result.split(',')[1];
                    const functions = firebase.functions();

                    const checkSafety = functions.httpsCallable('checkImageSafety');
                                        
                    await checkSafety({ image: base64Image });

                    // If it succeeds, the image is safe.
                    resolve({ safe: true, file: file });

                } catch (error) {
                    console.error("Image validation error:", error);
                    let reason = "Analysis failed.";
                    if (error.code === 'permission-denied') {
                        reason = error.message; // Use the specific error from the function
                    }
                    resolve({ safe: false, file: file, reason: reason });
                }
            };
            reader.onerror = () => {
                resolve({ safe: false, file: file, reason: "Could not read file." });
            };
        });
    }
    
    // Enhanced renderPreviews function with drag and drop support
    const renderPreviews = () => {
        previewContainer.innerHTML = ''; // Clear the container first

        // This loop creates the structure for each preview immediately and in order.
        filesToUpload.forEach((file, index) => {
            // 1. CREATE THE PREVIEW STRUCTURE SYNCHRONOUSLY
            const previewWrapper = document.createElement('div');
            previewWrapper.classList.add('preview-wrapper');
            previewWrapper.draggable = true;
            previewWrapper.dataset.index = index;

            const dragHandle = document.createElement('div');
            dragHandle.classList.add('drag-handle');
            dragHandle.innerHTML = '⋮⋮';

            const img = document.createElement('img');
            img.classList.add('preview-thumbnail');
            // We create the img tag, but we don't set its src yet.

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-preview-btn');
            removeBtn.textContent = 'X';
            removeBtn.type = 'button';
            removeBtn.onclick = () => {
                filesToUpload.splice(index, 1);
                renderPreviews(); // Re-render after removal
                analyzeBtn.disabled = filesToUpload.length === 0;
            };

            const positionBadge = document.createElement('div');
            positionBadge.classList.add('position-badge');
            positionBadge.textContent = index + 1; // The number is set correctly

            // 2. APPEND THE STRUCTURE TO THE DOM
            // This ensures the visual order matches the array order.
            previewWrapper.appendChild(dragHandle);
            previewWrapper.appendChild(img);
            previewWrapper.appendChild(removeBtn);
            previewWrapper.appendChild(positionBadge);
            previewContainer.appendChild(previewWrapper);

            // Add event listeners to the newly created element
            previewWrapper.addEventListener('dragstart', handleDragStart);
            previewWrapper.addEventListener('dragover', handleDragOver);
            previewWrapper.addEventListener('drop', handleDrop);
            previewWrapper.addEventListener('dragenter', handleDragEnter);
            previewWrapper.addEventListener('dragleave', handleDragLeave);
            previewWrapper.addEventListener('dragend', handleDragEnd);
            previewWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
            previewWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
            previewWrapper.addEventListener('touchend', handleTouchEnd);

            // 3. LOAD THE IMAGE DATA ASYNCHRONOUSLY
            // This part happens in the background. When the file is loaded,
            // it will populate the `src` of the `img` tag that's already in the correct visual position.
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // Desktop drag and drop handler functions
    function handleDragStart(e) {
        draggedIndex = parseInt(e.currentTarget.dataset.index);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Store some data to make the drag work in Firefox
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Allows us to drop
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops some browsers from redirecting
        }

        const dropIndex = parseInt(e.currentTarget.dataset.index);
        
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            // Reorder the files array
            // 1. Remove the dragged file from its original position and store it.
            const [draggedFile] = filesToUpload.splice(draggedIndex, 1);
            // 2. Insert the dragged file at the new drop position.
            filesToUpload.splice(dropIndex, 0, draggedFile);
            
            // Re-render the previews with new order
            renderPreviews();
        }
        
        return false;
    }

    function handleDragEnd(e) {
        // Clean up
        draggedIndex = null;
        document.querySelectorAll('.preview-wrapper').forEach(wrapper => {
            wrapper.classList.remove('dragging', 'drag-over');
        });
    }
    
    // Mobile touch handler functions
    function handleTouchStart(e) {
        const touch = e.targetTouches[0];
        touchItem = e.currentTarget;
        draggedIndex = parseInt(touchItem.dataset.index);
        
        // Calculate offset from touch point to element top-left
        const rect = touchItem.getBoundingClientRect();
        touchOffset.x = touch.clientX - rect.left;
        touchOffset.y = touch.clientY - rect.top;
        
        // Add dragging class for visual feedback
        touchItem.classList.add('dragging');
        touchItem.style.position = 'fixed';
        touchItem.style.zIndex = '1000';
        touchItem.style.width = rect.width + 'px';
        touchItem.style.height = rect.height + 'px';
        
        // Position at touch point
        touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
        touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';
        
        e.preventDefault();
    }
    
    function handleTouchMove(e) {
        if (!touchItem) return;
        
        const touch = e.targetTouches[0];
        
        // Update position
        touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
        touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';
        
        // Find element under touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementBelow) {
            const dropTarget = elementBelow.closest('.preview-wrapper');
            
            // Clear all drag-over states
            document.querySelectorAll('.preview-wrapper').forEach(wrapper => {
                wrapper.classList.remove('drag-over');
            });
            
            // Add drag-over to current target
            if (dropTarget && dropTarget !== touchItem) {
                dropTarget.classList.add('drag-over');
            }
        }
        
        e.preventDefault();
    }
    
    function handleTouchEnd(e) {
        if (!touchItem) return;
        
        // 1. Temporarily hide the element being dragged.
        touchItem.style.display = 'none';

        const touch = e.changedTouches[0];
        // 2. NOW, find the element underneath the touch point.
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

        // 3. Immediately make the dragged element visible again.
        touchItem.style.display = '';

        if (elementBelow) {
            const dropTarget = elementBelow.closest('.preview-wrapper');

            if (dropTarget && dropTarget !== touchItem) {
                const dropIndex = parseInt(dropTarget.dataset.index);

                if (draggedIndex !== null && draggedIndex !== dropIndex) {
                    // --- REFACTORED LOGIC (More Robust) ---
                    // 1. Remove the dragged file from its original position.
                    const [draggedFile] = filesToUpload.splice(draggedIndex, 1);
                    // 2. Insert the dragged file back into the array at the drop position.
                    filesToUpload.splice(dropIndex, 0, draggedFile);

                    // Re-render the previews with the new, correct order
                    renderPreviews();
                }
            }
        }
        
        // Clean up
        touchItem.style.position = '';
        touchItem.style.zIndex = '';
        touchItem.style.width = '';
        touchItem.style.height = '';
        touchItem.style.left = '';
        touchItem.style.top = '';
        touchItem.classList.remove('dragging');
        
        document.querySelectorAll('.preview-wrapper').forEach(wrapper => {
            wrapper.classList.remove('drag-over');
        });
        
        touchItem = null;
        draggedIndex = null;
        
        e.preventDefault();
    }

    /**
     * This now runs the safety check AND shows the new progress bar.
     */
    imageInput.addEventListener('change', async (event) => {
        formError.textContent = ''; // Clear previous errors
        aiStatus.textContent = ''; // Clear AI status
        const newFiles = Array.from(event.target.files);

        if (newFiles.length === 0) return;

        // --- Show and configure the analysis progress bar ---
        analysisProgressContainer.style.display = 'block';
        analysisProgressBar.value = 0;
        analysisProgressBar.max = newFiles.length;
        analysisProgressLabel.textContent = `Analyzing image 1 of ${newFiles.length}...`;
        
        submitBtn.disabled = true;
        imageInput.disabled = true;
        
        let completedFiles = 0;
        let errorMessages = [];
        let allFilesSafe = true;

        // We wrap the safety check to report progress as each promise resolves
        const validationPromises = newFiles.map((file, index) => {
            return validateImageSafety(file).then(result => {
                // This 'then' block runs as soon as *one* check finishes
                completedFiles++;
                analysisProgressBar.value = completedFiles;
                analysisProgressLabel.textContent = `Analyzed ${completedFiles} of ${newFiles.length}...`;
                
                // Now, handle the result of this one file
                if (result.safe) {
                    if (filesToUpload.length < 4) {
                        filesToUpload.push(result.file);
                    } else {
                        errorMessages.push(`Max 4 images. '${result.file.name}' was not added.`);
                        allFilesSafe = false;
                    }
                } else {
                    errorMessages.push(`<b>${result.file.name}</b> rejected: ${result.reason}`);
                    allFilesSafe = false;
                }
                
                return result; // Pass the result along
            });
        });

        // Wait for all the wrapped promises to finish
        const results = await Promise.all(validationPromises);

        // --- Update UI after all analysis is complete ---
        analysisProgressContainer.style.display = 'none'; // Hide progress bar
        
        if (errorMessages.length > 0) {
            formError.innerHTML = errorMessages.join('<br>');
        }

        renderPreviews(); // Render only the safe files that were added

        // Update status message
        if (allFilesSafe && newFiles.length > 0) {
            aiStatus.textContent = "✅ Images approved.";
            aiStatus.style.color = 'green';
        } else if (!allFilesSafe) {
            aiStatus.textContent = "❌ Some images were rejected.";
            aiStatus.style.color = 'red';
        }

        analyzeBtn.disabled = filesToUpload.length === 0;
        submitBtn.disabled = false;
        imageInput.disabled = false;
    });

    
    /**
     * This now shows the new indeterminate progress bar during analysis.
     */
    analyzeBtn.addEventListener('click', async () => {
        if (filesToUpload.length === 0) {
            formError.textContent = "Please select an image first.";
            return;
        }

        const fileToAnalyze = filesToUpload[0]; // Always analyze the first image
        aiStatus.textContent = "Analyzing for suggestions, please wait...";
        aiStatus.style.color = '#333';
        analyzeBtn.disabled = true;
        
        // --- NEW: Show the AI progress bar ---
        aiProgressContainer.style.display = 'block';

        const reader = new FileReader();
        reader.readAsDataURL(fileToAnalyze);
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(',')[1];
                
                // This still calls the "heavy" function, which is correct
                const functions = firebase.functions();
                const analyzeImage = functions.httpsCallable('analyzeImageForSuggestions');

                const result = await analyzeImage({ image: base64Image });

                document.getElementById('listing-title').value = result.data.title || '';
                document.getElementById('listing-desc').value = result.data.description || '';
                
                aiStatus.textContent = "✅ Suggestions loaded!";
                aiStatus.style.color = 'green';

            } catch (error) {
                console.error("Error calling analyzeImage function:", error);
                aiStatus.textContent = `❌ Error: ${error.message}`;
                aiStatus.style.color = 'red';
                if (error.code === 'permission-denied') {
                    filesToUpload.shift(); // Removes the first item
                    renderPreviews();
                }
            } finally {
                // --- Hide the AI progress bar ---
                aiProgressContainer.style.display = 'none';
                analyzeBtn.disabled = filesToUpload.length === 0;
            }
        };
        reader.onerror = (error) => {
             console.error("File reading error:", error);
             aiStatus.textContent = "❌ Error: Could not read the image file.";
             aiStatus.style.color = 'red';
             analyzeBtn.disabled = false;
             // --- Hide the AI progress bar on failure too ---
             aiProgressContainer.style.display = 'none';
        };
    });

    // Main form submission logic with the new workflow
    listingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!user) {
            formError.textContent = "You must be logged in to create a listing.";
            return;
        }
        try {
            // Get the token and check the claims
            const tokenResult = await user.getIdTokenResult(false); // false = don't force, it was refreshed on load
            const isFullyVerified = tokenResult.claims.email_verified === true &&
                                    tokenResult.claims.manuallyVerified === true;

            if (!isFullyVerified) {
                console.warn("Submit check failed. Claims:", tokenResult.claims);
                formError.textContent = "Error: Your verification is still processing. Please wait a moment and try again.";
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
        if (filesToUpload.length === 0) {
            formError.textContent = "Please select at least one image.";
            return;
        }

        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        progressContainer.style.display = 'block';
        formError.textContent = '';

        let docRef = null;

        try {

            // 1. Create a placeholder document in Firestore first to get a unique ID.
            docRef = await db.collection("listings").add({
                title: title,
                title_lowercase: title.toLowerCase(),
                title_tokens: title.toLowerCase().split(/\s+/).filter(Boolean),
                description: description,
                price: Number(price),
                sellerId: user.uid,
                sellerEmail: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "processing", // Mark status as processing
                totalImages: filesToUpload.length 
            });

            // 2. Map over all selected files to create the upload promises.
            const uploadPromises = filesToUpload.map((file, index) => {
                // Use the new document's ID to create a unique storage path for each image.
                const filePath = `listings/${user.uid}/${docRef.id}/${Date.now()}_${file.name}`;
                const fileRef = storage.ref(filePath);

                const uploadTask = fileRef.put(file, {
                    contentType: file.type || 'image/jpeg',
                    customMetadata: {
                        'sortOrder': String(index)
                    }
                });

                // Return a new promise that resolves when the upload is complete
                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // This will update the progress bar for each file sequentially
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            progressBar.value = progress;
                            progressLabel.textContent = `Uploading image ${index + 1} of ${filesToUpload.length}... ${Math.round(progress)}%`;
                        },
                        (error) => reject(error), // Reject the promise on error
                        () => resolve() // Resolve the promise on success
                    );
                });
            });

            // 3. Wait for all file uploads to complete.
            await Promise.all(uploadPromises);

            // 4. The frontend's job is now done. The backend Cloud Function will
            // automatically process the images and update the Firestore document.
            alert('Listing submitted! Images are being processed and will appear shortly.');
            filesToUpload = []; // Clear the file array
            document.getElementById('home-link').click(); // Navigate back to the home page

        } catch (error) {
            console.error("Error during listing creation:", error);
            formError.textContent = "An error occurred during upload. Please try again.";
            if (docRef) {
                await db.collection("listings").doc(docRef.id).delete();
                console.log("Rollback successful: Deleted incomplete Firestore document.");
            }
            submitBtn.disabled = false;
            cancelBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });
    
    // Cancel button listener (This remains the same)
    cancelBtn.addEventListener('click', () => {
        filesToUpload = [];
        renderWelcomeView(user, auth, db, storage);
    });
}


// --FUNCTION FOR FETCHING SPECIFIC LISTING DATA FROM FIRESTORE TO DISPLAY--
function addCardEventListeners(auth, db, storage) {
    const listingCards = document.querySelectorAll('.listing-card');
    listingCards.forEach(card => {
        // Add the click event listener directly to the card
        card.addEventListener('click', async (e) => { // Make async
            e.preventDefault();
            const currentUser = auth.currentUser;
            const listingId = card.dataset.id;

            // first check if user is lgoged out
            if (!currentUser) {
                alert('You must be logged-in and verified to view details.');
                return; // Stop the function here
            }

            // Use token-based verification check
            const tokenResult = await currentUser.getIdTokenResult(false);
            const isFullyVerified = tokenResult.claims.email_verified === true &&
                                    tokenResult.claims.manuallyVerified === true;

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