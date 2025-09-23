import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import projectsRouter from './projects.js';
import * as ProjectDao from '../database/dao/ProjectDao.js';
import { authenticate } from '../middleware/auth.js';
import { AVAILABLE_LANGUAGES } from '../constants.js';
import crypto from 'crypto';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/projects', projectsRouter);

/**
 * @swagger
 * /check-last-edit/{id}:
 *   get:
 *     summary: Get the last modified translation for a locale
 *     tags: [Translations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the project.
 *         schema: { "type": "string" }
 *       - in: query
 *         name: locale
 *         required: true
 *         description: The language code of the locale to check.
 *         schema: { "type": "string", "example": "it" }
 *       - in: query
 *         name: branch
 *         required: false
 *         description: The name of the branch to check. Defaults to 'main'.
 *         schema: { "type": "string", "example": "feature/new-checkout" }
 *     responses:
 *       "200":
 *         description: Details of the last modified translation for the specified locale.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LastEditResponse'
 *       "400":
 *         description: "Bad Request: 'locale' query parameter is required."
 *       "401":
 *         description: "Unauthorized"
 *       "404":
 *         description: "Not Found: No project found, or no edits found for the specified locale."
 */
router.get('/check-last-edit/:id', authenticate, async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const langCode = req.query.locale;
        const branchName = req.query.branch || 'main'; // Default to 'main' if not provided

        if (!langCode) {
            return res.status(400).json({ message: "The 'locale' query parameter is required." });
        }

        const lastEdit = await ProjectDao.findLastModifiedTranslation(projectId, langCode, branchName);

        if (lastEdit) {
            res.json(lastEdit);
        } else {
            res.status(404).json({ message: `No edits found for locale '${langCode}' in branch '${branchName}' of project '${projectId}'.` });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /read-all/{id}:
 *   get:
 *     summary: Get all terms and translations for a specific locale in a project
 *     tags: [Translations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the project.
 *         schema: { "type": "string" }
 *       - in: query
 *         name: locale
 *         required: true
 *         description: The language code of the locale to retrieve.
 *         schema: { "type": "string", "example": "it" }
 *     responses:
 *       "200":
 *         description: An object containing all key-value translation pairs for the locale.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: "An object where the key is the locale code, mapping to an object of translations."
 *               additionalProperties:
 *                 type: object
 *                 description: "An object mapping term keys to translated strings."
 *                 additionalProperties:
 *                   type: string
 *               example:
 *                 it:
 *                   add_to_cart: "Aggiungi al carrello"
 *                   checkout_button: "Paga"
 *       "400":
 *         description: "Bad Request: 'locale' query parameter is required."
 *       "401":
 *         description: "Unauthorized"
 *       "404":
 *         description: "Not Found: Project not found."
 */
router.get('/read-all/:id', authenticate, async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const langCode = req.query.locale;

        if (!langCode) {
            return res.status(400).json({ message: "The 'locale' query parameter is required." });
        }

        const terms = await ProjectDao.getTermsForLocale(projectId, langCode);

        if (terms === null) {
            return res.status(404).json({ message: `Project with ID '${projectId}' not found.` });
        }

        res.json({
            [langCode]: terms
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /locale/read:
 *   get:
 *     summary: Retrieve all available locales
 *     tags: [Translations]
 *     responses:
 *       "200":
 *         description: A list of all available locales.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocaleDetails'
 *       "401":
 *         description: "Unauthorized"
 */
router.get('/locale/read', authenticate, (req, res) => {
    const now = new Date().toISOString();
    
    // Using a simple hash of the language code to generate a consistent UUID-like ID
    const generateId = (code) => {
        const hash = crypto.createHash('sha1').update(code).digest('hex');
        return `${hash.substr(0, 8)}-${hash.substr(8, 4)}-${hash.substr(12, 4)}-${hash.substr(16, 4)}-${hash.substr(20, 12)}`;
    };

    const formattedLocales = AVAILABLE_LANGUAGES.map((lang, index) => ({
        id: generateId(lang.code),
        name: `${lang.name}_V1`,
        localeId: (index + 1).toString(),
        createdAt: now,
        updatedAt: now,
        language: lang.name.toLowerCase(),
        code: lang.code,
        region: null,
    }));
    res.json(formattedLocales);
});


export default router;