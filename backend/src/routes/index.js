import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import projectsRouter from './projects.js';
import * as ProjectDao from '../database/dao/ProjectDao.js';
import { authenticate } from '../middleware/auth.js';

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

        if (!langCode) {
            return res.status(400).json({ message: "The 'locale' query parameter is required." });
        }

        const lastEdit = await ProjectDao.findLastModifiedTranslation(projectId, langCode);

        if (lastEdit) {
            res.json(lastEdit);
        } else {
            res.status(404).json({ message: `No edits found for locale '${langCode}' in project '${projectId}'.` });
        }
    } catch (error) {
        next(error);
    }
});


export default router;