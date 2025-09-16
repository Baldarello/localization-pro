import { Router } from 'express';
import * as UserDao from '../database/dao/UserDao.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, pass } = req.body;
        if (!email || !pass) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await UserDao.login(email, pass);
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        next(error);
    }
});

export default router;
