document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const registerForm = document.getElementById('register-form');
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        window.location.href = 'index.html'; // Redirect to main app if already logged in
    }

    // Registration form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value.trim();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        
        // Simple validation
        if (!email || !username || !password || !confirmPassword) {
            showError(registerForm, 'Please fill in all fields.');
            return;
        }
        
        if (password !== confirmPassword) {
            showError(registerForm, 'Passwords do not match.');
            return;
        }
        
        if (password.length < 6) {
            showError(registerForm, 'Password must be at least 6 characters.');
            return;
        }
        
        // Check if username contains only alphanumeric characters
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showError(registerForm, 'Username can only contain letters, numbers, and underscores.');
            return;
        }
        
        // Check if email is valid
        if (!/\S+@\S+\.\S+/.test(email)) {
            showError(registerForm, 'Please enter a valid email address.');
            return;
        }
        
        // Mock registration success - store user info
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            name: username,
            email: email
        }));
        
        // Show success message
        showSuccess(registerForm, 'Registration successful! Redirecting to the app...');
        
        // Redirect to main app after a delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });

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
    
    // Helper function to show success messages
    function showSuccess(form, message) {
        // Check if success element already exists
        let successElement = form.querySelector('.success-message');
        
        if (!successElement) {
            // Create success element if it doesn't exist
            successElement = document.createElement('div');
            successElement.className = 'success-message';
            form.appendChild(successElement);
        }
        
        // Show the message
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}); 