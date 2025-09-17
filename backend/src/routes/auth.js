import { Router } from 'express';
import * as UserDao from '../database/dao/UserDao.js';
import { sendEmail } from '../helpers/mailer.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "user-1"
 *         name:
 *           type: string
 *           example: "Alice (Admin)"
 *         email:
 *           type: string
 *           format: email
 *           example: "alice@example.com"
 *         avatarInitials:
 *           type: string
 *           example: "A"
 *         settings:
 *           type: object
 *           properties:
 *             commitNotifications:
 *               type: boolean
 *     UserRole:
 *       type: string
 *       enum: [translator, editor, admin]
 *     Language:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: "en"
 *         name:
 *           type: string
 *           example: "English"
 *     Term:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         text:
 *           type: string
 *           description: The term key.
 *         context:
 *           type: string
 *           description: Context for translators.
 *         translations:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           example:
 *             en: "Submit"
 *             es: "Enviar"
 *     Commit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         message:
 *           type: string
 *         authorId:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         terms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Term'
 *     Branch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         commits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Commit'
 *         workingTerms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Term'
 *     TeamMembershipDetails:
 *        type: object
 *        properties:
 *          role:
 *            $ref: '#/components/schemas/UserRole'
 *          languages:
 *            type: array
 *            items:
 *              type: string
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         defaultLanguageCode:
 *           type: string
 *         languages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Language'
 *         branches:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Branch'
 *         currentBranchName:
 *           type: string
 *         team:
 *           type: object
 *           description: "Maps user ID to role and assigned languages."
 *           additionalProperties:
 *             $ref: '#/components/schemas/TeamMembershipDetails'
 *     AddMemberResult:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         code:
 *           type: string
 *           enum: [user_exists, user_not_found, project_not_found]
 *
 * tags:
 *   - name: Authentication
 *     description: User authentication
 *   - name: Users
 *     description: User management
 *   - name: Projects
 *     description: Project management operations
 *   - name: Terms
 *     description: Term key management
 *   - name: Translations
 *     description: Translation management
 *   - name: Team
 *     description: Project team management
 *   - name: Branches
 *     description: Branch management operations
 *   - name: Commits
 *     description: Commit history operations
 */

// POST /api/v1/auth/login
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     description: Authenticates a user and returns their details. No authentication token is required for this endpoint.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pass
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               pass:
 *                 type: string
 *                 format: password
 *                 example: "password"
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized / Invalid credentials
 */
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


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Creates a new user account.
 *     security: []
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
 *                 example: "New User"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "new.user@example.com"
 *               pass:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       409:
 *         description: Conflict / Email already exists
 */
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, pass } = req.body;
        if (!name || !email || !pass) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }
        
        const newUser = await UserDao.registerUser(name, email, pass);

        // Send welcome email
        const subject = 'Welcome to Localization Manager Pro!';
        const html = `<h1>Hi ${name},</h1><p>Thank you for registering. You can now log in to your account and start managing your projects.</p>`;
        sendEmail(email, subject, html);
        
        res.status(201).json(newUser);

    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
});


/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     description: Sends a password reset link to the user's email if the account exists.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *     responses:
 *       200:
 *         description: If an account with that email exists, a reset link has been sent.
 */
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await UserDao.findUserByEmail(email);

        if (user) {
            // In a real app, generate a unique token, save it to the DB with an expiry, and create a reset URL.
            // For this mock, we'll just send an email directly.
            const subject = 'Your Password Reset Request';
            const html = `<p>Hi ${user.name},</p><p>You requested to reset your password. In a real application, you would click a link here to complete the process.</p><p>If you did not request this, please ignore this email.</p>`;
            sendEmail(user.email, subject, html);
        }
        
        // Always return a success message to prevent user enumeration attacks.
        res.json({ message: 'If an account with that email exists, password reset instructions have been sent.' });

    } catch (error) {
        next(error);
    }
});

export default router;
