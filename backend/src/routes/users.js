import { Router } from 'express';
import * as UserDao from '../database/dao/UserDao.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/users
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *          description: Unauthorized
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const users = await UserDao.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/users/me/notifications
/**
 * @swagger
 * /users/me/notifications:
 *   get:
 *     summary: Get notifications for the current user
 *     tags: [Users]
 *     responses:
 *       '200':
 *         description: A list of notifications for the user.
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Notification'
 *       '401':
 *         description: Unauthorized
 */
router.get('/me/notifications', authenticate, async (req, res, next) => {
    try {
        const notifications = await UserDao.getNotificationsForUser(req.user.id);
        res.json(notifications);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/users/me/notifications/read
/**
 * @swagger
 * /users/me/notifications/read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationIds]
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       '204':
 *         description: Notifications marked as read.
 *       '401':
 *         description: Unauthorized
 */
router.post('/me/notifications/read', authenticate, async (req, res, next) => {
    try {
        const { notificationIds } = req.body;
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'notificationIds must be an array.'});
        }
        await UserDao.markNotificationsAsRead(req.user.id, notificationIds);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});


// PUT /api/v1/users/:userId/profile
/**
 * @swagger
 * /users/{userId}/profile:
 *   put:
 *     summary: Update a user's profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name for the user
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *          description: Unauthorized
 *       404:
 *          description: User not found
 */
router.put('/:userId/profile', authenticate, async (req, res, next) => {
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

/**
 * @swagger
 * /users/{userId}/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: string }
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commitNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:userId/settings', authenticate, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const updatedUser = await UserDao.updateUserSettings(userId, req.body);
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
/**
 * @swagger
 * /users/{userId}/password:
 *   put:
 *     summary: Change a user's password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request (e.g., current password incorrect)
 *       401:
 *         description: Unauthorized
 */
router.put('/:userId/password', authenticate, async (req, res, next) => {
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
