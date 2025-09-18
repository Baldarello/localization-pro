import * as UserDao from '../database/dao/UserDao.js';
import * as ProjectDao from '../database/dao/ProjectDao.js';
import logger from '../helpers/logger.js';

export const authenticate = async (req, res, next) => {
    // Primary method: Check for a valid session from Passport.js
    if (req.isAuthenticated()) {
        return next();
    }

    // Second method: Check for API Key authentication
    const keyPrefix = req.headers['x-api-key-prefix'];
    const authHeader = req.headers['authorization'];

    if (keyPrefix && authHeader && authHeader.startsWith('Bearer ')) {
        const secret = authHeader.substring(7); // "Bearer ".length
        try {
            const user = await ProjectDao.validateAndGetUserFromApiKey(keyPrefix, secret);
            if (user) {
                // Attach user to the request. The rest of the app's permission logic
                // will work as if this user is logged in via a session.
                req.user = user;
                return next();
            }
        } catch (error) {
            logger.error('API Key Auth Error:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // Fallback for mock/testing: Check for the X-User-ID header
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: No active session or valid API key found.' });
    }

    try {
        const user = await UserDao.getUserById(userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid user ID.' });
        }

        // Manually attach user to the request object for the mock auth flow.
        req.user = user; 
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
