import env from './env.js';

// Initialize Appwrite
const client = new Appwrite.Client();
client
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID);

// Initialize Appwrite account
const account = new Appwrite.Account(client);

// Authentication services
const AuthService = {
    // Get current user
    getCurrentUser: async () => {
        try {
            return await account.get();
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Check if user is logged in
    isLoggedIn: async () => {
        try {
            const user = await account.get();
            return !!user;
        } catch (error) {
            return false;
        }
    },

    // Google OAuth login
    loginWithGoogle: async () => {
        try {
            // The success and failure URLs should be absolute URLs to your app
            const currentUrl = window.location.origin;
            return account.createOAuth2Session(
                'google',
                `${currentUrl}/index.html`, // Success URL
                `${currentUrl}/login.html`  // Failure URL
            );
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            return await account.deleteSession('current');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
};

export default AuthService; 