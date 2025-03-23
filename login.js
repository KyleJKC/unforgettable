document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginSection = document.querySelector('.login-section');
    const signupSection = document.querySelector('.signup-section');
    const signupLink = document.getElementById('signup-link');
    const loginLink = document.getElementById('login-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        window.location.href = 'index.html'; // Redirect to main app if already logged in
    }

    // Event listeners for switching between login and signup
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'registration.html'; // Redirect to dedicated registration page
    });

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupSection.style.display = 'none';
            loginSection.style.display = 'block';
        });
    }

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset functionality will be implemented in the future.');
    });

    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // For now, just do a simple check 
        // In a real app, this would validate against a backend
        if (email && password) {
            // Mock login success - store login state
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify({
                email: email,
                name: email.split('@')[0] // Just use part of email as name for now
            }));
            
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            showError(loginForm, 'Please enter both email and password.');
        }
    });

    // Signup form submission (if present in this page)
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value.trim();
            const confirmPassword = document.getElementById('signup-confirm-password').value.trim();
            
            // Simple validation
            if (!name || !email || !password || !confirmPassword) {
                showError(signupForm, 'Please fill in all fields.');
                return;
            }
            
            if (password !== confirmPassword) {
                showError(signupForm, 'Passwords do not match.');
                return;
            }
            
            // Mock signup success - store user info
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify({
                name: name,
                email: email
            }));
            
            // Redirect to main app
            window.location.href = 'index.html';
        });
    }

    // Helper function to show error messages
    function showError(form, message) {
        // Check if error element already exists
        let errorElement = form.querySelector('.error-message');
        
        if (!errorElement) {
            // Create error element if it doesn't exist
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            form.appendChild(errorElement);
        }
        
        // Show the message
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}); 