// --- GET HTML ELEMENTS ---
const navLinks = document.getElementById('nav-links');
const appContent = document.getElementById('app-content');
const listingsGrid = document.getElementById('listings-grid');
const listingsSection = document.getElementById('listings-section');

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

        <div class="form-check">
            <input type="checkbox" id="listing-trade">
            <label for="listing-trade">Open to trades?</label>
        </div>


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
            <p>$${listing.price} ${listing.isTrade ? '<span class="trade-badge">🔄 Trade</span>' : ''}</p>
            <button class="view-details-btn">View Details</button>
        </div>
    </div>
    `;
};

const itemDetailsHTML = (listing, isOwner, sellerRating = { avg: 0, count: 0 }) => {
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
        ${listing.isTrade ? `<p class="trade-info">🔄 This seller is open to trades.</p>` : ''}
        <p class="description">${listing.description}</p>
        <p class="seller">Sold by: ${listing.sellerEmail}</p>
        ${sellerRating.count > 0 ? `
            <div class="item-details-rating">
                ${[...Array(5)].map((_, i) => `
                    <span class="star ${i < Math.round(sellerRating.avg) ? 'filled' : ''}">★</span>
                `).join('')}
                <span class="item-details-review-count">
                    (${sellerRating.count} ${sellerRating.count === 1 ? 'review' : 'reviews'})
                </span>
                <button type="button" id="view-seller-reviews-btn" class="view-reviews-btn">
                    (View all reviews)
                </button>
            </div>
        ` : `
            <div class="item-details-rating">
                <span class="item-details-review-count">(No reviews yet)</span>
            </div>
        `}


        ${isOwner ? `
        <div class="owner-actions">
            <button id="edit-listing-btn-main" class="edit-listing-btn">Edit Listing</button>
            <button id="delete-listing-btn-main" class="delete-listing-btn">Delete Listing</button>
            <button id="mark-as-sold-btn-main" class="mark-as-sold-btn">Mark as Sold</button>
        </div>
        ` : ''}
        <div id="reviews-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <button type="button" class="modal-close-btn">&times;</button>
                <h3>Reviews for ${listing.sellerEmail}</h3>
                <div id="reviews-modal-list" class="reviews-modal-list">
                    </div>
            </div>
        </div>
    </div>
    `;
};

const editListingHTML = (listing) => `
    <h2>Edit Listing</h2>
    <form id="edit-listing-form">
        <input type="text" id="listing-title" value="${listing.title}" required>
        <textarea id="listing-desc" required>${listing.description}</textarea>
        <input type="number" id="listing-price" value="${listing.price}" step="0.01" required>

        <div class="form-check">
            <input type="checkbox" id="listing-trade" ${listing.isTrade ? 'checked' : ''}>
            <label for="listing-trade">Open to trades?</label>
        </div>

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

// User Dashboard 
const userDashboardHTML = `
    <div class="dashboard-profile-header">
        <div class="profile-info">
            <h2 id="user-email">Loading...</h2>
            <div class="profile-rating" id="user-rating-container" style="display: none;">
                </div>
            <span id="user-review-count">(No reviews yet)</span>
        </div>
    </div>

    <div class="dashboard-nav-tabs">
        <button id="tab-my-listings" class="dashboard-tab active">My Listings</button>
        <button id="tab-my-orders" class="dashboard-tab">My Orders</button>
        <button id="tab-my-reviews" class="dashboard-tab">My Reviews</button>
    </div>

    <div class="dashboard-content">
        </div>
`;
const myListingCardHTML = (listing, id) => {
    let imageUrl = "https://via.placeholder.com/400x400.png?text=No+Image";
    if (listing.processedImages && listing.processedImages.length > 0 && listing.processedImages[0].thumb) {
        imageUrl = listing.processedImages[0].thumb;
    }

    return `
    <div class="listing-card my-listing-card" data-id="${id}">
        <img src="${imageUrl}" alt="${listing.title}">
        <div class="listing-card-info">
            <h3>${listing.title}</h3>
            <p>$${listing.price} ${listing.isTrade ? '<span class="trade-badge">🔄 Trade</span>' : ''}</p>
        </div>
        <div class="my-listing-card-actions">
            ${listing.status === 'active' ? 
            `<button class="mark-as-sold-btn" data-id="${id}">Mark as Sold</button>
            <button class="edit-listing-btn" data-id="${id}">Edit</button>
            <button class = "delete-listing-btn" data-id="${id}">Delete</button>` 
            : 
            `<span class="listing-sold-badge">SOLD</span>`
            }
        </div>
    </div>
    `;
};

// --- Card for the "My Orders" tab ---
const orderCardHTML = (order, id) => `
    <div class="order-card" data-id="${id}">
    <img src="${order.listingThumbnail || 'https://via.placeholder.com/400x400.png?text=No+Image'}" alt="${order.listingTitle}" class="order-card-thumbnail">
        <div class="order-card-info">
            <h4>${order.listingTitle}</h4>
            <p>Sold by: ${order.sellerEmail}</p>
            <p>Price: $${order.purchasePrice}</p>
            <p>Status: ${order.status}</p>
        </div>
        <div class="order-card-actions">
            ${order.status === 'completed' ? // Only allow review if completed
            `<button class="leave-review-btn" data-id="${id}">Leave Review</button>`
            : ''}
        </div>
    </div>
`;

// --- Form for creating a review ---
const createReviewHTML = (listingTitle) => `
    <h2>Leave a Review for: ${listingTitle}</h2>
    <form id="create-review-form">
        <div class="star-rating-input">
            <label>Rating:</label>
            <div class="stars">
                <span data-value="5">★</span>
                <span data-value="4">★</span>
                <span data-value="3">★</span>
                <span data-value="2">★</span>
                <span data-value="1">★</span>
            </div>
            <input type="hidden" id="review-rating" value="0" required>
        </div>
        <textarea id="review-comment" placeholder="Leave a comment (optional)"></textarea>
        <button type="submit">Submit Review</button>
        <button type="button" id="cancel-review-btn">Cancel</button>
    </form>
    <p id="form-error" class="error"></p>
`;

// --- Card for the "My Reviews" tab ---
const reviewCardHTML = (review) => {
    // Generate stars HTML
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="star ${i <= review.rating ? 'filled' : ''}">★</span>`;
    }

    return `
    <div class="review-card">
        <div class="review-card-rating">
            ${starsHTML}
        </div>
        <p class="review-card-comment">"${review.comment}"</p>
        <p class="review-card-buyer">From: ${review.buyerEmail || 'Anonymous'}</p>
    </div>
    `;
};

function renderWelcomeView(user, auth, db, storage) {
    appContent.innerHTML = welcomeHTML(user);
    document.getElementById('create-listing-btn').addEventListener('click', () => {
        sessionStorage.setItem('currentView', 'createListing');
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

        const appCheck = firebase.appCheck();
        appCheck.activate(
            firebaseConfig.recaptchaKeyV3, // <-- Use the NEW v3 key
            true
        );

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
                    <a href="#" id="dashboard-link">Dashboard</a>
                    <div id="notification-bell-container" class="nav-notification-bell">
                        <button id="notification-bell-btn">🔔</button>
                        <span id="notification-badge"></span>
                        <div id="notification-dropdown">
                            <div id="notification-dropdown-header">Notifications</div>
                            <div id="notification-list-content"></div>
                        </div>
                    </div>
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

                document.getElementById('dashboard-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    // The function now handles its own state
                    renderUserDashboard(auth, db, storage);
                });

                // --- ROUTING LOGIC: RESTORE VIEW ON PAGE LOAD/REFRESH ---
                const savedView = sessionStorage.getItem('currentView');
                
                if (savedView === 'dashboard') {
                    renderUserDashboard(auth, db, storage);

                } else if (savedView === 'itemDetails') {
                    const savedItemId = sessionStorage.getItem('currentItemId');
                    if (savedItemId) {
                        showItemDetails(auth, db, storage, savedItemId);
                    } else {
                        document.getElementById('home-link').click(); // Go home if ID is missing
                    }

                } else if (savedView === 'createListing') {
                    // --- Handle create listing state ---
                    appContent.innerHTML = createListingHTML;
                    addListingFormListener(auth, db, storage);
                
                } else if (savedView === 'editListing') {
                    // --- Handle edit listing state ---
                    const savedItemId = sessionStorage.getItem('currentItemId');
                    if (savedItemId) {
                        // We must re-fetch the doc to pre-fill the form
                        db.collection('listings').doc(savedItemId).get().then(doc => {
                            if (doc.exists) {
                                appContent.innerHTML = editListingHTML(doc.data());
                                addEditFormListener(auth, db, storage, savedItemId);
                            } else {
                                alert("The item you were editing seems to be deleted.");
                                document.getElementById('home-link').click();
                            }
                        }).catch(err => {
                            console.error("Error fetching doc for edit:", err);
                            document.getElementById('home-link').click();
                        });
                    } else {
                        document.getElementById('home-link').click(); // Go home if ID is missing
                    }

                } else {
                    // Default to the home view
                    renderWelcomeView(currentUser, auth, db, storage);
                }
                setupNotificationListener(auth, db);
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


// --- FUNCTION TO RENDER USER DASHBOARD ---
async function renderUserDashboard(auth, db, storage, defaultTab = 'my-listings') {
    const user = auth.currentUser;
    if (!user) return;

    sessionStorage.setItem('currentView', 'dashboard');
    appContent.innerHTML = userDashboardHTML;
    listingsSection.style.display = 'none'; // Hide main listings
    
    // Find the empty container
    const dashboardContent = document.querySelector('.dashboard-content');

    // --- 1. Load User Profile Data (Same as before) ---
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        document.getElementById('user-email').textContent = userData.email;
        const averageRating = userData.averageRating || 0;
        const reviewCount = userData.reviewCount || 0;
        const ratingContainer = document.getElementById('user-rating-container');
        if (reviewCount > 0) {
            ratingContainer.style.display = 'inline-block';
            let starsHTML = '';
            const filledStars = Math.round(averageRating);
            for (let i = 1; i <= 5; i++) {
                starsHTML += `<span class="star ${i <= filledStars ? 'filled' : ''}">★</span>`;
            }
            ratingContainer.innerHTML = starsHTML;
            const reviewText = reviewCount === 1 ? '1 review' : `${reviewCount} reviews`;
            document.getElementById('user-review-count').textContent = `(${reviewText})`;
        }
    } else {
        document.getElementById('user-email').textContent = user.email;
    }

    // --- 2. Add Listeners for Dashboard UI ---
    
    // Handle clicks on the content area (for "Leave Review")
    dashboardContent.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target || !target.classList.contains('leave-review-btn')) return;

        const orderId = target.dataset.id;
        renderCreateReviewForm(auth, db, storage, orderId);
    });

    // Handle tab switching
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.id === 'tab-my-listings') {
                renderMyListingsTab(auth, db, storage, dashboardContent); // <-- UPDATED
            } else if (tab.id === 'tab-my-orders') {
                renderMyOrders(auth, db, storage, dashboardContent);
            } else if (tab.id === 'tab-my-reviews') {
                renderMyReviews(auth, db, storage, dashboardContent);
            }
        });
    });

    // --- 3. Load the correct tab ---
    // Find the button corresponding to the defaultTab (e.g., 'tab-my-reviews')
    const tabToLoad = document.getElementById(`tab-${defaultTab}`);
    
    if (tabToLoad) {
        tabToLoad.click(); // This will click the correct tab, which will load its content.
    } else {
        // Fallback just in case
        document.getElementById('tab-my-listings').click();
    }
}

// --- NEW FUNCTION: Renders the "My Listings" Tab ---
function renderMyListingsTab(auth, db, storage, containerElement) {
    const user = auth.currentUser;
    containerElement.innerHTML = '<h2>My Listings</h2>'; // Set title
    
    // Create the grid
    const myGrid = document.createElement('div');
    myGrid.id = 'my-listings-grid';
    myGrid.className = 'listings-grid';
    containerElement.appendChild(myGrid);

    myGrid.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const listingId = target.dataset.id;

        if (target.classList.contains('mark-as-sold-btn')) {
            let buyerEmail = prompt("Please enter the buyer's GSU email address:");
            if (buyerEmail) {
                buyerEmail = buyerEmail.toLowerCase().trim();
            }
            if (buyerEmail && (buyerEmail.endsWith('@student.gsu.edu') || buyerEmail.endsWith('@gsu.edu'))) {
                const markAsSoldFunc = firebase.functions().httpsCallable('markAsSold');
                target.textContent = "Processing...";
                target.disabled = true;
                
                markAsSoldFunc({ listingId: listingId, buyerEmail: buyerEmail })
                    .then(result => {
                        alert("Listing successfully marked as sold!");
                    })
                    .catch(error => {
                        console.error("Error marking as sold:", error);
                        alert(`Error: ${error.message}`);
                        target.textContent = "Mark as Sold";
                        target.disabled = false;
                    });
            } else if (buyerEmail) {
                alert("Invalid GSU email address.");
            }
        }

        if (target.classList.contains('edit-listing-btn')) {
            db.collection('listings').doc(listingId).get().then(doc => {
                if (doc.exists) {
                    sessionStorage.setItem('currentView', 'editListing');
                    sessionStorage.setItem('currentItemId', listingId); // This was the other bug fix
                    appContent.innerHTML = editListingHTML(doc.data());
                    addEditFormListener(auth, db, storage, listingId);
                }
            });
        }
        if (target.classList.contains('delete-listing-btn')) {
            if (confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) {
                target.textContent = "Deleting...";
                target.disabled = true;

                db.collection('listings').doc(listingId).delete()
                    .then(() => {
                        // Manually remove the card from the UI
                        const card = target.closest('.listing-card');
                        if (card) {
                            card.remove();
                        }
                        alert('Listing deleted.');
                        // Check if grid is now empty
                        if (myGrid.children.length === 0) {
                            myGrid.innerHTML = '<p>You have not created any listings yet.</p>';
                        }
                    })
                    .catch(err => {
                        console.error("Error deleting listing:", err);
                        alert('Failed to delete listing.');
                        target.textContent = "Delete";
                        target.disabled = false;
                    });
            }
        }
    });

    db.collection('listings')
        .where('sellerId', '==', user.uid)
        .get()
        .then((querySnapshot) => {
            myGrid.innerHTML = ''; // Clear the grid
            if (querySnapshot.empty) {
                myGrid.innerHTML = '<p>You have not created any listings yet.</p>';
                return;
            }

            // --- Client-side sorting ---
            // 1. Map docs to an array
            const listings = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

            // 2. Sort the array by createdAt date, newest first
            listings.sort((a, b) => {
                const timeA = a.data.createdAt ? a.data.createdAt.toMillis() : 0; // <-- FIX
                const timeB = b.data.createdAt ? b.data.createdAt.toMillis() : 0; // <-- FIX
                return timeB - timeA; // b - a for descending order
            });
            // --- End client-side sorting ---

            // 3. Render the sorted listings
            listings.forEach(listing => {
                // Use listing.data and listing.id from our sorted array
                myGrid.innerHTML += myListingCardHTML(listing.data, listing.id);
            });

        })
        .catch((error) => { // <-- Use .catch() with .get()
            console.error("Error fetching user's listings:", error);
            myGrid.innerHTML = '<p class="error">Could not load your listings.</p>';
        });
}

// --- Renders the "My Orders" Tab ---
async function renderMyOrders(auth, db, storage, containerElement) {
    const user = auth.currentUser;
    containerElement.innerHTML = '<h2>My Orders</h2>'; // Set title

    try {
        const querySnapshot = await db.collection('orders')
            .where('buyerId', '==', user.uid)
            .get();

        if (querySnapshot.empty) {
            containerElement.innerHTML += '<p>You have not purchased any items yet.</p>';
            return;
        }

        // --- Client-side sorting ---
        // 1. Map docs to an array
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        // 2. Sort the array by createdAt date, newest first
        orders.sort((a, b) => {
            const timeA = a.data.createdAt ? a.data.createdAt.toMillis() : 0;
            const timeB = b.data.createdAt ? b.data.createdAt.toMillis() : 0;
            return timeB - timeA; // b - a for descending order
        });
        // --- End client-side sorting ---

        // 3. Render the sorted orders from the array
        orders.forEach(order => {
            containerElement.innerHTML += orderCardHTML(order.data, order.id);
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        containerElement.innerHTML += '<p class="error">Could not load your orders.</p>';
    }
}

// --- Renders the "My Reviews" Tab ---
async function renderMyReviews(auth, db, storage, containerElement) {
    const user = auth.currentUser;
    containerElement.innerHTML = '<h2>Reviews About You</h2>'; // Set title

    try {
        const querySnapshot = await db.collection('reviews')
            .where('revieweeId', '==', user.uid)
            .get();

        if (querySnapshot.empty) {
            containerElement.innerHTML += '<p>You have not received any reviews yet.</p>';
            return;
        }

        // --- Client-side sorting ---
        const reviews = querySnapshot.docs.map(doc => doc.data());
        reviews.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA; // b - a for descending order
        });
        // --- End sorting ---

        // 3. Render the sorted reviews
        reviews.forEach(review => {
            containerElement.innerHTML += reviewCardHTML(review);
        });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        containerElement.innerHTML += '<p class="error">Could not load your reviews.</p>';
    }
}

// --- Renders the "Create Review" Form ---
async function renderCreateReviewForm(auth, db, storage, orderId) {
    const user = auth.currentUser;
    
    // 1. Get the order details
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
        alert("Error: Order not found.");
        return;
    }
    const order = orderDoc.data();

    // 2. Check if a review already exists
    const reviewQuery = await db.collection('reviews').where('orderId', '==', orderId).limit(1).get();
    if (!reviewQuery.empty) {
        alert("You have already left a review for this order.");
        return;
    }

    // 3. Show the form
    appContent.innerHTML = createReviewHTML(order.listingTitle);

    // 4. Add star rating listeners
    const stars = document.querySelectorAll('.star-rating-input .stars span');
    const ratingInput = document.getElementById('review-rating');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const ratingValue = star.dataset.value;
            ratingInput.value = ratingValue;
            // Highlight selected stars
            stars.forEach(s => {
                s.classList.toggle('filled', s.dataset.value <= ratingValue);
            });
        });
    });

    // 5. Add form submit listener
    document.getElementById('create-review-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = parseInt(ratingInput.value, 10);
        const comment = document.getElementById('review-comment').value;

        if (rating === 0) {
            document.getElementById('form-error').textContent = "Please select a rating.";
            return;
        }

        // Create the new review document
        db.collection('reviews').add({
            orderId: orderId,
            listingId: order.listingId,
            rating: rating,
            comment: comment,
            revieweeId: order.sellerId, // The user being reviewed
            reviewerId: user.uid,      // The user writing the review
            buyerEmail: user.email,    // For display
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("Review submitted! Thank you.");
            // Mark the order as 'reviewed' so the button disappears
            orderRef.update({ status: 'reviewed' });
            // Go back to the dashboard
            renderUserDashboard(auth, db, storage);
        })
        .catch(error => {
            console.error("Error submitting review:", error);
            document.getElementById('form-error').textContent = "Failed to submit review.";
        });
    });

    // 6. Cancel button
    document.getElementById('cancel-review-btn').addEventListener('click', () => {
        document.getElementById('dashboard-link').click();
    });
}

// reusable function that renders the details page AND attaches all button listeners.
async function showItemDetails(auth, db, storage, listingId) {
    sessionStorage.setItem('currentView', 'itemDetails');
    sessionStorage.setItem('currentItemId', listingId);

    try { 
        const doc = await db.collection('listings').doc(listingId).get({ source: 'server' });

        if (doc.exists) {
            const listingData = doc.data();
            const currentUser = auth.currentUser;

            let sellerRatingData = { avg: 0, count: 0 };
            try {
                if (listingData.sellerId) {
                    const sellerRef = db.collection('users').doc(listingData.sellerId);
                    const sellerDoc = await sellerRef.get();
                    if (sellerDoc.exists) {
                        const sellerData = sellerDoc.data();
                        sellerRatingData.avg = sellerData.averageRating || 0;
                        sellerRatingData.count = sellerData.reviewCount || 0;
                    }
                }
            } catch (err) {
                console.warn("Could not fetch seller rating:", err);
            }

            const isOwner = currentUser && currentUser.uid === listingData.sellerId;

            document.getElementById('app-content').style.display = 'block';
            document.getElementById('listings-section').style.display = 'none';
            // The updated itemDetailsHTML function is now called here
            appContent.innerHTML = itemDetailsHTML(listingData, isOwner, sellerRatingData);

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

            const soldBtn = document.getElementById('mark-as-sold-btn-main');
            if (soldBtn) {
                soldBtn.addEventListener('click', () => {
                    // This logic is copied from the dashboard
                    let buyerEmail = prompt("Please enter the buyer's GSU email address:");

                    if (buyerEmail) {
                        buyerEmail = buyerEmail.toLowerCase().trim();
                    }

                    if (buyerEmail && (buyerEmail.endsWith('@student.gsu.edu') || buyerEmail.endsWith('@gsu.edu'))) {

                        const markAsSoldFunc = firebase.functions().httpsCallable('markAsSold');
                        soldBtn.textContent = "Processing...";
                        soldBtn.disabled = true;

                        markAsSoldFunc({ listingId: listingId, buyerEmail: buyerEmail })
                            .then(result => {
                                alert("Listing successfully marked as sold!");
                                // After selling, go back to the home page
                                document.getElementById('home-link').click(); 
                            })
                            .catch(error => {
                                console.error("Error marking as sold:", error);
                                alert(`Error: ${error.message}`);
                                soldBtn.textContent = "Mark as Sold";
                                soldBtn.disabled = false;
                            });
                    } else if (buyerEmail) {
                        alert("Invalid GSU email address.");
                    }
                });
            }

            const editBtn = document.getElementById('edit-listing-btn-main');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    // This logic is copied from the dashboard edit button
                    sessionStorage.setItem('currentView', 'editListing');
                    sessionStorage.setItem('currentItemId', listingId); 
                    appContent.innerHTML = editListingHTML(listingData);
                    addEditFormListener(auth, db, storage, listingId);
                });
            }

            const deleteBtn = document.getElementById('delete-listing-btn-main');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) {
                        try {
                            // Disable button
                            deleteBtn.textContent = "Deleting...";
                            deleteBtn.disabled = true;
                            // Delete from firestore
                            await db.collection('listings').doc(listingId).delete();
                            alert('Listing deleted successfully.');
                            // Go back home
                            document.getElementById('home-link').click(); 
                        } catch (err) {
                            console.error("Error deleting listing:", err);
                            alert('Failed to delete listing.');
                            deleteBtn.textContent = "Delete Listing";
                            deleteBtn.disabled = false;
                        }
                    }
                });
            }

            const viewReviewsBtn = document.getElementById('view-seller-reviews-btn');
            const reviewsModal = document.getElementById('reviews-modal');

            if (viewReviewsBtn && reviewsModal) {
                const modalList = document.getElementById('reviews-modal-list');
                const modalCloseBtn = reviewsModal.querySelector('.modal-close-btn');

                // Function to open the modal and fetch reviews
                const openModal = async () => {
                    reviewsModal.style.display = 'flex';
                    modalList.innerHTML = '<p>Loading reviews...</p>';

                    try {
                        const reviewSnapshot = await db.collection('reviews')
                            .where('revieweeId', '==', listingData.sellerId)
                            .get();

                        if (reviewSnapshot.empty) {
                            modalList.innerHTML = '<p>This seller has no reviews yet.</p>';
                            return;
                        }

                        const reviews = reviewSnapshot.docs.map(doc => doc.data());
                        reviews.sort((a, b) => {
                            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                            const timeB = b.data.createdAt ? b.data.createdAt.toMillis() : 0;
                            return timeB - timeA; // b - a for descending order
                        });

                        modalList.innerHTML = ''; // Clear loading
                        reviewSnapshot.forEach(reviewDoc => {
                            // We can re-use the existing dashboard review card template
                            modalList.innerHTML += reviewCardHTML(reviewDoc.data());
                        });

                    } catch (err) {
                        console.error("Error fetching seller reviews:", err);
                        modalList.innerHTML = '<p class="error">Could not load reviews.</p>';
                    }
                };

                // Function to close the modal
                const closeModal = () => {
                    reviewsModal.style.display = 'none';
                    modalList.innerHTML = ''; // Clear content
                };

                // Add event listeners
                viewReviewsBtn.addEventListener('click', openModal);
                modalCloseBtn.addEventListener('click', closeModal);

                // Close modal by clicking on the overlay (outside the content)
                reviewsModal.addEventListener('click', (e) => {
                    if (e.target === reviewsModal) {
                        closeModal();
                    }
                });
            }

            document.getElementById('back-to-listings-btn').addEventListener('click', () => {
                const previousView = sessionStorage.getItem('previousView');
                if (previousView === 'dashboard') { 
                    document.getElementById('dashboard-link').click();
                } else {
                    document.getElementById('home-link').click();
                }
            });
            
        } else {
            alert("This listing may have been deleted.");
            document.getElementById('home-link').click();
        }
    } catch(error) {
        console.error("Error fetching item details:", error);
        alert("Could not load listing details.");
    }
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
        const updatedTrade = document.getElementById('listing-trade').checked;

        // Update the document in Firestore
        db.collection('listings').doc(listingId).update({
            title: updatedTitle,
            isTrade: updatedTrade,
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

            removeBtn.addEventListener('touchstart', (e) => {
                // stop touch from bubbling up to the parent wrapper.
                // prevents the parent's 'touchstart' (drag) from ever firing.
                e.stopPropagation();
                
                // prevent the browser from also firing a "click" event (ghost click).
                e.preventDefault(); 
                
                // now, run the original delete logic.
                filesToUpload.splice(index, 1);
                renderPreviews(); // Re-render after removal
                analyzeBtn.disabled = filesToUpload.length === 0;
            });


            removeBtn.onclick = (e) => {
                e.stopPropagation();

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
        const isTrade = document.getElementById('listing-trade').checked; //adding trade option

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
                isTrade: isTrade,
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
        document.getElementById('home-link').click();
    });
}


// --FUNCTION FOR FETCHING SPECIFIC LISTING DATA FROM FIRESTORE TO DISPLAY--
function addCardEventListeners(auth, db, storage) {
    const listingCards = document.querySelectorAll('.listing-card');
    listingCards.forEach(card => {
        // Add the click event listener directly to the card
        card.addEventListener('click', async (e) => {
            e.preventDefault();
            const currentUser = auth.currentUser;
            const listingId = card.dataset.id;

            if (!currentUser) {
                alert('You must be logged-in and verified to view details.');
                return;
            }

            try {
                const tokenResult = await currentUser.getIdTokenResult(false);
                const isFullyVerified = tokenResult.claims.email_verified === true &&
                                        tokenResult.claims.manuallyVerified === true;

                if (isFullyVerified) {
                    const currentView = sessionStorage.getItem('currentView') || 'home';
                    sessionStorage.setItem('previousView', currentView);

                    showItemDetails(auth, db, storage, listingId);
                } else {
                    alert('You must be logged-in and verified to view details.');
                }

            } catch (error) {
                console.error("Error checking user verification:", error);
                alert("An error occurred while checking your verification status. Please try again.");
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
                    email: email.toLowerCase().trim(),
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
// --- NOTIFICATION SYSTEM ---
function setupNotificationListener(auth, db) {
    const user = auth.currentUser;
    if (!user) return;

    const bellContainer = document.getElementById('notification-bell-container');
    const bellBtn = document.getElementById('notification-bell-btn');
    const badge = document.getElementById('notification-badge');
    const dropdown = document.getElementById('notification-dropdown');
    const listContent = document.getElementById('notification-list-content');

    if (!bellContainer) return; // In case user logs out while listener is setting up

    // 1. Listen for UNREAD notifications to show/hide the badge
    const unreadQuery = db.collection('notifications')
        .where('userId', '==', user.uid)
        .where('isRead', '==', false);

    const unreadListener = unreadQuery.onSnapshot((snapshot) => {
        if (snapshot.empty) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'block';
        }
    }, (error) => {
        console.error("Error listening for notifications:", error);
    });

    // 2. Function to load all recent notifications into the dropdown
    let isLoading = false;
    async function loadNotifications() {
        if (isLoading) return;
        isLoading = true;
        listContent.innerHTML = '<p style="padding: 1rem; text-align: center;">Loading...</p>';

        try {
            const snapshot = await db.collection('notifications')
                .where('userId', '==', user.uid)
                .limit(10)
                .get();

            if (snapshot.empty) {
                listContent.innerHTML = '<p style="padding: 1rem; text-align: center;">No notifications yet.</p>';
                return;
            }

            // --- Client-side sorting ---
            const notifications = snapshot.docs.map(doc => doc.data());
            notifications.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA; // b - a for descending order
            });

            listContent.innerHTML = ''; // Clear loading
            // Now loop over our sorted array
            notifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                if (!notif.isRead) {
                    item.classList.add('is-unread');
                }
                item.innerHTML = notif.message;
                item.dataset.linkTo = notif.linkTo || 'none';
                listContent.appendChild(item);
            });

        } catch (err) {
            console.error("Error loading notifications:", err);
            listContent.innerHTML = '<p class="error" style="padding: 1rem;">Could not load notifications.</p>';
        } finally {
            isLoading = false;
        }
    }

    // 3. Function to mark all unread notifications as "read"
    async function markNotificationsAsRead() {
        const unreadSnapshot = await unreadQuery.get();
        if (unreadSnapshot.empty) return;

        const batch = db.batch();
        unreadSnapshot.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
        // The listener will automatically hide the badge
    }

    // 4. Handle clicks on the bell
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            dropdown.style.display = 'block';
            loadNotifications();
            markNotificationsAsRead();
        }
    });

    // 5. Handle clicks on notification items (to navigate)
    listContent.addEventListener('click', (e) => {
        const item = e.target.closest('.notification-item');
        if (!item) return;

        const link = item.dataset.linkTo;
        if (link.startsWith('dashboard-')) {
            // Get the tab name, e.g., "my-reviews"
            const tabName = link.substring('dashboard-'.length); 
            
            // Directly call renderUserDashboard and pass the tab name.
            // This avoids the race condition completely.
            renderUserDashboard(auth, db, storage, tabName);
        }
        dropdown.style.display = 'none';
    });

    // 6. Close dropdown if clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!bellContainer.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// --- START THE APP ---
initializeApp();
setupTheme();