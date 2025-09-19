import { Router } from 'express';
import passport from 'passport';
import * as UserDao from '../database/dao/UserDao.js';
import { sendEmail } from '../helpers/mailer.js';
import logger from '../helpers/logger.js';

const router = Router();
const isGoogleAuthEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/**
 * @swagger
 * /auth/config:
 *   get:
 *     summary: Get authentication configuration
 *     tags: [Authentication]
 *     responses:
 *       '200':
 *         description: Provides configuration details for the frontend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 googleAuthEnabled:
 *                   type: boolean
 *                 usageLimits:
 *                   type: object
 *                   properties:
 *                      enforced: 
 *                          type: boolean
 *                      projects:
 *                          type: number
 *                      terms:
 *                          type: number
 *                      members:
 *                          type: number
 */
router.get('/config', (req, res) => {
    const config = {
        googleAuthEnabled: isGoogleAuthEnabled,
    };

    if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
        config.usageLimits = {
            enforced: true,
            projects: 3,
            terms: 1000,
            members: 5,
        };
    }

    res.json(config);
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, pass]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               pass:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized / Invalid credentials
 */
router.post('/login', async (req, res, next) => {
    const { email, pass } = req.body;
    try {
        const user = await UserDao.login(email, pass);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Use req.login to establish a session, managed by Passport
        req.login(user, (err) => {
            if (err) { return next(err); }
            return res.json(user);
        });

    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     responses:
 *       '204':
 *         description: User logged out successfully.
 */
router.post('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.sendStatus(204);
        });
    });
});


/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Authentication]
 *     responses:
 *       '200':
 *         description: The currently logged in user's data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Not authenticated.
 */
router.get('/me', (req, res) => {
    // If req.user exists (from Passport's session management), user is authenticated
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, pass]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               pass:
 *                 type: string
 *                 format: password
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  user:
 *                      $ref: '#/components/schemas/User'
 *                  message:
 *                      type: string
 *       '400':
 *         description: Email already exists
 */
router.post('/register', async (req, res, next) => {
    const { name, email, pass } = req.body;
    try {
        const newUser = await UserDao.registerUser(name, email, pass);
        res.status(201).json({ user: newUser, message: 'Registration successful!' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       '200':
 *         description: If an account with that email exists, reset instructions have been sent.
 */
router.post('/forgot-password', async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await UserDao.findUserByEmail(email);
        if (user) {
            // In a real app, you would generate a token, save it, and send a reset link.
            // For this app, we'll just simulate the email part.
            const subject = 'Your Password Reset Request';
            const html = `<p>Hi ${user.name},</p><p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p><p>Note: This is a demo. Password reset functionality is not fully implemented.</p>`;
            sendEmail(user.email, subject, html);
        }
        // Always return a success message to prevent user enumeration
        res.json({ message: 'If an account with that email exists, password reset instructions have been sent.' });
    } catch (error) {
        next(error);
    }
});


// --- Google OAuth Routes ---

// The initial request to Google
if (isGoogleAuthEnabled) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
}

// The callback URL Google redirects to
if (isGoogleAuthEnabled) {
    router.get('/google/callback', 
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
            // Successful authentication, redirect to the frontend.
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(frontendUrl);
        }
    );
}


export default router;