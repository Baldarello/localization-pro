import * as UserDao from '../database/dao/UserDao.js';
import logger from '../helpers/logger.js';

export const authenticate = async (req, res, next) => {
    // Primary method: Check for a valid session from Passport.js
    if (req.isAuthenticated()) {
        return next();
    }

    // Fallback for mock/testing: Check for the X-User-ID header
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: No active session or X-User-ID header found.' });
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
