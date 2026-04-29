// User Directory Application
let users = [];
let filteredUsers = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting app...');
    initializeApp();
});

// Main initialization function
async function initializeApp() {
    try {
        console.log('Initializing app...');
        
        // Get DOM elements
        const userList = document.getElementById('userList');
        const searchInput = document.getElementById('searchInput');
        const addUserForm = document.querySelector('.add-user-form');
        
        console.log('DOM elements found:', {
            userList: !!userList,
            searchInput: !!searchInput,
            addUserForm: !!addUserForm
        });
        
        if (!userList) {
            console.error('User list element not found!');
            return;
        }
        
        // Load users from localStorage or fetch from API
        const storedUsers = localStorage.getItem('users');
        
        if (storedUsers) {
            console.log('Loading users from localStorage...');
            users = JSON.parse(storedUsers);
            filteredUsers = [...users];
            displayUsers(filteredUsers);
        } else {
            console.log('Fetching users from API...');
            await fetchUsers();
        }
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('App initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize the application');
    }
}

// Fetch users from API
async function fetchUsers() {
    try {
        console.log('Starting API fetch...');
        showLoading('Loading users...');
        
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        console.log('API response received:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const apiUsers = await response.json();
        console.log('API users received:', apiUsers);
        
        // Transform API data to match our format
        users = apiUsers.map(user => {
            console.log('Processing user:', user.name, 'Address:', user.address);
            
            // Extract city with multiple fallback options
            let city = 'Unknown City';
            
            if (user.address) {
                if (typeof user.address === 'string') {
                    city = user.address;
                } else if (user.address.city) {
                    city = user.address.city;
                } else if (user.address.street || user.address.suite) {
                    // If no city, combine street and suite as fallback
                    city = [user.address.street, user.address.suite].filter(Boolean).join(', ') || 'Unknown City';
                } else if (user.address.zipcode) {
                    city = `Area ${user.address.zipcode}`;
                }
            }
            
            return {
                id: user.id || Date.now(),
                name: user.name || 'Unknown User',
                email: user.email || 'unknown@example.com',
                city: city
            };
        });
        
        console.log('Transformed users:', users);
        
        filteredUsers = [...users];
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Display users
        displayUsers(filteredUsers);
        
    } catch (error) {
        console.error('Error fetching users:', error);
        showError('Failed to fetch users from the server. Please try again later.');
    }
}

// Display users in the UI
function displayUsers(usersToDisplay) {
    const userList = document.getElementById('userList');
    
    if (!userList) {
        console.error('User list element not found in displayUsers');
        return;
    }
    
    console.log('Displaying users:', usersToDisplay.length, 'users');
    
    // Log each user's data for debugging
    usersToDisplay.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
            name: user.name,
            email: user.email,
            city: user.city,
            cityType: typeof user.city,
            cityLength: user.city ? user.city.length : 'undefined'
        });
    });
    
    if (usersToDisplay.length === 0) {
        userList.innerHTML = `
            <div class="no-users-message">
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    userList.innerHTML = usersToDisplay.map(user => {
        const userHtml = `
        <div class="user-card" data-user-id="${user.id}">
            <h3 class="user-name">${escapeHtml(user.name)}</h3>
            <div class="user-details">
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${escapeHtml(user.email)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">City:</span>
                    <span class="detail-value">${escapeHtml(user.city)}</span>
                </div>
            </div>
        </div>
        `;
        console.log('Generated HTML for user:', user.name, 'City:', user.city);
        return userHtml;
    }).join('');
    
    console.log('Users displayed successfully');
}

// Add a new user
function addUser(event) {
    event.preventDefault();
    
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userCityInput = document.getElementById('userCity');
    
    // Get form values
    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const city = userCityInput.value.trim();
    
    console.log('Adding user:', { name, email, city });
    
    // Basic validation
    if (!validateForm(name, email, city)) {
        return;
    }
    
    // Create new user object
    const newUser = {
        id: Date.now(), // Simple unique ID
        name: name,
        email: email,
        city: city
    };
    
    console.log('New user created:', newUser);
    
    // Add to users array
    users.push(newUser);
    filteredUsers = [...users];
    
    console.log('Users array after adding:', users.length, 'total users');
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Verify it was saved
    const savedUsers = localStorage.getItem('users');
    console.log('Verification - saved users in localStorage:', savedUsers ? JSON.parse(savedUsers).length : 'none');
    
    // Update UI
    displayUsers(filteredUsers);
    
    // Clear form
    clearForm();
    
    // Show success message
    showSuccess('User added successfully!');
}

// Validate form inputs
function validateForm(name, email, city) {
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userCityInput = document.getElementById('userCity');
    
    let isValid = true;
    
    // Remove existing error classes
    [userNameInput, userEmailInput, userCityInput].forEach(input => {
        if (input) input.classList.remove('error');
    });
    
    // Validate name
    if (!name) {
        if (userNameInput) userNameInput.classList.add('error');
        isValid = false;
    }
    
    // Validate email
    if (!email || !isValidEmail(email)) {
        if (userEmailInput) userEmailInput.classList.add('error');
        isValid = false;
    }
    
    // Validate city
    if (!city) {
        if (userCityInput) userCityInput.classList.add('error');
        isValid = false;
    }
    
    if (!isValid) {
        showError('Please fill in all fields correctly');
    }
    
    return isValid;
}

// Simple email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Clear form inputs
function clearForm() {
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userCityInput = document.getElementById('userCity');
    
    if (userNameInput) userNameInput.value = '';
    if (userEmailInput) userEmailInput.value = '';
    if (userCityInput) userCityInput.value = '';
    
    // Remove error classes
    [userNameInput, userEmailInput, userCityInput].forEach(input => {
        if (input) input.classList.remove('error');
    });
}

// Save users to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Users saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Search functionality
function searchUsers(searchTerm, shouldScroll = true) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        filteredUsers = [...users];
    } else {
        filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(term)
        );
    }
    
    displayUsers(filteredUsers);
    
    // Auto-scroll to user directory section
    if (shouldScroll && filteredUsers.length > 0) {
        scrollToUserDirectory();
    }
    
    // Show message if no results
    if (filteredUsers.length === 0 && term !== '') {
        showNoResultsMessage(term);
    }
}

// Scroll to user directory section
function scrollToUserDirectory() {
    const userDirectorySection = document.querySelector('.user-directory-section');
    if (userDirectorySection) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
            userDirectorySection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        });
    }
}

// Show loading state
function showLoading(message = 'Loading...') {
    const userList = document.getElementById('userList');
    if (userList) {
        userList.innerHTML = `
            <div class="loading-message">
                <p>${message}</p>
            </div>
        `;
    }
}

// Show error message
function showError(message) {
    const userList = document.getElementById('userList');
    if (userList) {
        userList.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}

// Show success message
function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #EA580C 0%, #7C2D12 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(234, 88, 12, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Show no results message
function showNoResultsMessage(searchTerm) {
    const userList = document.getElementById('userList');
    if (userList) {
        userList.innerHTML = `
            <div class="no-results-message">
                <p>No users found matching "${escapeHtml(searchTerm)}"</p>
                <p>Try searching with different keywords</p>
            </div>
        `;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search input (real-time search without scroll)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchUsers(this.value, false); // Don't scroll on typing
        });
        console.log('Search input listener added');
    }
    
    // Search button (search with scroll)
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const searchValue = searchInput ? searchInput.value : '';
            searchUsers(searchValue, true); // Scroll on button click
        });
        console.log('Search button listener added');
    }
    
    // Add user form
    const addUserForm = document.querySelector('.add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', addUser);
        console.log('Add user form listener added');
    }
    
    // Remove error class on input
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userCityInput = document.getElementById('userCity');
    
    [userNameInput, userEmailInput, userCityInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('error');
            });
        }
    });
    
    console.log('Event listeners set up completed');
}

// Add CSS for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .loading-message,
    .error-message,
    .no-users-message,
    .no-results-message {
        text-align: center;
        padding: 40px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(15px);
        border-radius: 25px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        margin: 20px 0;
    }
    
    .loading-message p,
    .error-message p,
    .no-users-message p,
    .no-results-message p {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
    }
    
    .error-message p {
        color: #ef4444;
    }
    
    .no-results-message p:first-child {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
        margin-bottom: 10px;
    }
    
    .no-results-message p:last-child {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
    }
`;
document.head.appendChild(style);

console.log('Script loaded successfully!');
