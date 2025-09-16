import * as UserDao from '../database/dao/UserDao.js';
import logger from '../helpers/logger.js';

export const authenticate = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: X-User-ID header is missing.' });
    }

    try {
        // For this mock app, we'll just check if a user with this ID exists.
        // A real app would validate a JWT or session token.
        const user = await UserDao.getUserById(userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid user ID.' });
        }

        req.user = user; // Attach user to the request object
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
