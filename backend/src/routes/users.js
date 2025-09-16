import { Router } from 'express';
import * as UserDao from '../database/dao/UserDao.js';

const router = Router();

// GET /api/v1/users
router.get('/', async (req, res, next) => {
    try {
        const users = await UserDao.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/users/:userId/profile
router.put('/:userId/profile', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name } = req.body;
        const updatedUser = await UserDao.updateUserName(userId, name);
        if (updatedUser) {
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/users/:userId/password
router.put('/:userId/password', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        const result = await UserDao.changePassword(userId, currentPassword, newPassword);
        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        next(error);
    }
});


export default router;
