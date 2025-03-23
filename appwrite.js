import env from './env.js';

// Initialize Appwrite
const client = new Appwrite.Client();
client
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID);

// Initialize Appwrite account
const account = new Appwrite.Account(client);

// Initialize Appwrite databases and collections 
const databases = new Appwrite.Databases(client);
const DATABASE_ID = env.APPWRITE_DATABASE_ID;
const REMINDER_ITEMS_COLLECTION_ID = env.APPWRITE_REMINDER_ITEMS_COLLECTION_ID;
const USER_SETTINGS_COLLECTION_ID = env.APPWRITE_USER_SETTINGS_COLLECTION_ID;

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

// Database services for reminder items
const ItemService = {
    // Get all items for current user
    getItems: async () => {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                REMINDER_ITEMS_COLLECTION_ID,
                [
                    Appwrite.Query.equal('userId', user.$id)
                ]
            );
            
            return response.documents;
        } catch (error) {
            console.error('Error getting items:', error);
            return [];
        }
    },
    
    // Create a new item
    createItem: async (item) => {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            
            return await databases.createDocument(
                DATABASE_ID,
                REMINDER_ITEMS_COLLECTION_ID,
                Appwrite.ID.unique(),
                {
                    ...item,
                    userId: user.$id
                }
            );
        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        }
    },
    
    // Delete an item
    deleteItem: async (itemId) => {
        try {
            return await databases.deleteDocument(
                DATABASE_ID,
                REMINDER_ITEMS_COLLECTION_ID,
                itemId
            );
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    }
};

// Database services for user settings
const UserSettingsService = {
    // Get home location
    getHomeLocation: async () => {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                USER_SETTINGS_COLLECTION_ID,
                [
                    Appwrite.Query.equal('userId', user.$id),
                    Appwrite.Query.equal('key', 'home-location')
                ]
            );
            
            if (response.documents.length > 0) {
                return JSON.parse(response.documents[0].value);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting home location:', error);
            return null;
        }
    },
    
    // Save home location
    saveHomeLocation: async (location) => {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            
            // Check if home location already exists
            const response = await databases.listDocuments(
                DATABASE_ID,
                USER_SETTINGS_COLLECTION_ID,
                [
                    Appwrite.Query.equal('userId', user.$id),
                    Appwrite.Query.equal('key', 'home-location')
                ]
            );
            
            if (response.documents.length > 0) {
                // Update existing document
                return await databases.updateDocument(
                    DATABASE_ID,
                    USER_SETTINGS_COLLECTION_ID,
                    response.documents[0].$id,
                    {
                        value: JSON.stringify(location)
                    }
                );
            } else {
                // Create new document
                return await databases.createDocument(
                    DATABASE_ID,
                    USER_SETTINGS_COLLECTION_ID,
                    Appwrite.ID.unique(),
                    {
                        userId: user.$id,
                        key: 'home-location',
                        value: JSON.stringify(location)
                    }
                );
            }
        } catch (error) {
            console.error('Error saving home location:', error);
            throw error;
        }
    }
};

export { AuthService, ItemService, UserSettingsService }; 