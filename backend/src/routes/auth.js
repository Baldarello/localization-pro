import { Router } from 'express';
import * as UserDao from '../database/dao/UserDao.js';

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

export default router;
