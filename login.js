import AuthService from './appwrite.js';

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Check if user is already logged in
    try {
        const isLoggedIn = await AuthService.isLoggedIn();
        
        if (isLoggedIn) {
            window.location.href = 'index.html'; // Redirect to main app if already logged in
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }

    // Google OAuth login
    googleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Add loading state to button
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = '<span>Connecting to Google...</span>';
        
        try {
            // This will redirect to Google OAuth login
            await AuthService.loginWithGoogle();
            // User will be redirected to the success URL after login
            // No need to handle redirect here
        } catch (error) {
            // Reset button state
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                    <path fill="none" d="M0 0h18v18H0z"/>
                </svg>
                <span>Sign in with Google</span>
            `;
            showError(`Google login failed: ${error.message}`);
        }
    });

    // Helper function to show error messages
    function showError(message) {
        // Create error element if it doesn't exist
        let errorElement = document.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            document.querySelector('.login-card').appendChild(errorElement);
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