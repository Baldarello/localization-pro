import { Router } from 'express';
import * as ProjectDao from '../database/dao/ProjectDao.js';
import { authenticate } from '../middleware/auth.js';
import { TeamMembership } from '../database/models/index.js';

const router = Router();

// Helper to check if a user is an admin for a specific project
const isProjectAdmin = async (userId, projectId) => {
    if (!userId || !projectId) return false;
    const membership = await TeamMembership.findOne({ where: { userId, projectId } });
    return membership && membership.role === 'admin';
};

// --- Projects ---

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the current user
 *     tags: [Projects]
 *     responses:
 *       '200':
 *         description: A list of projects the user is a member of
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       '401':
 *         description: Unauthorized
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const projects = await ProjectDao.getAllProjects(req.user.id);
        res.json(projects);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single project object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project not found
 */
router.get('/:projectId', authenticate, async (req, res, next) => {
    try {
        const project = await ProjectDao.getProjectById(req.params.projectId);
        if (project) {
            res.json(project);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 *     responses:
 *       '201':
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { name } = req.body;
        const newProject = await ProjectDao.createProject(name, req.user.id);
        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/languages:
 *   put:
 *     summary: Update project languages
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Language'
 *     responses:
 *       '200':
 *         description: Languages updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project not found
 */
router.put('/:projectId/languages', authenticate, async (req, res, next) => {
    try {
        const updatedProject = await ProjectDao.updateProjectLanguages(req.params.projectId, req.body);
        res.json(updatedProject);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/defaultLanguage:
 *   put:
 *     summary: Set the default language for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - langCode
 *             properties:
 *               langCode:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Default language updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project not found
 */
router.put('/:projectId/defaultLanguage', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.setDefaultLanguage(req.params.projectId, req.body.langCode);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/currentBranch:
 *   put:
 *     summary: Switch the current branch for a project
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchName
 *             properties:
 *               branchName:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Branch switched
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.put('/:projectId/currentBranch', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.switchBranch(req.params.projectId, req.body.branchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- API Keys ---
/**
 * @swagger
 * /projects/{projectId}/api-keys:
 *   get:
 *     summary: Get all API keys for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: A list of API keys for the project.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApiKey'
 *       '401': { description: "Unauthorized" }
 *       '403': { description: "Forbidden" }
 *       '404': { description: "Project not found" }
 */
router.get('/:projectId/api-keys', authenticate, async (req, res, next) => {
    try {
        if (!(await isProjectAdmin(req.user.id, req.params.projectId))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const apiKeys = await ProjectDao.getApiKeysForProject(req.params.projectId);
        res.json(apiKeys);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/api-keys:
 *   post:
 *     summary: Create a new API key for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, permissions]
 *             properties:
 *               name: { type: string, example: "CI/CD Key" }
 *               permissions: { $ref: '#/components/schemas/ApiKeyPermissions' }
 *     responses:
 *       '201':
 *         description: API Key created successfully. The `secret` is only returned on creation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKey'
 *       '401': { description: "Unauthorized" }
 *       '403': { description: "Forbidden" }
 */
router.post('/:projectId/api-keys', authenticate, async (req, res, next) => {
    try {
        if (!(await isProjectAdmin(req.user.id, req.params.projectId))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { name, permissions } = req.body;
        const newApiKey = await ProjectDao.createApiKey(req.params.projectId, { name, permissions }, req.user.id);
        res.status(201).json(newApiKey);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/api-keys/{keyId}:
 *   delete:
 *     summary: Revoke (delete) an API key
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204':
 *         description: API Key revoked successfully.
 *       '401': { description: "Unauthorized" }
 *       '403': { description: "Forbidden" }
 */
router.delete('/:projectId/api-keys/:keyId', authenticate, async (req, res, next) => {
    try {
        if (!(await isProjectAdmin(req.user.id, req.params.projectId))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        await ProjectDao.deleteApiKey(req.params.projectId, req.params.keyId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});



// --- Terms ---

/**
 * @swagger
 * /projects/{projectId}/terms:
 *   post:
 *     summary: Add a new term to the current branch
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termText
 *             properties:
 *               termText:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Term created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Term'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.post('/:projectId/terms', authenticate, async (req, res, next) => {
    try {
        const newTerm = await ProjectDao.addTerm(req.params.projectId, req.body.termText, req.user.id);
        res.status(201).json(newTerm);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/bulk:
 *   put:
 *     summary: Bulk update terms in the current branch
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Term'
 *     responses:
 *       '204':
 *         description: Terms updated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.put('/:projectId/terms/bulk', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.bulkUpdateTerms(req.params.projectId, req.body, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}:
 *   put:
 *     summary: Update a term's key text in the current branch
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Term updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project, branch, or term not found
 */
router.put('/:projectId/terms/:termId', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.updateTermText(req.params.projectId, req.params.termId, req.body.text, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}:
 *   delete:
 *     summary: Delete a term from the current branch
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Term deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project, branch, or term not found
 */
router.delete('/:projectId/terms/:termId', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.deleteTerm(req.params.projectId, req.params.termId, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}/context:
 *   put:
 *     summary: Update a term's context in the current branch
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *             properties:
 *               context:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Context updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project, branch, or term not found
 */
router.put('/:projectId/terms/:termId/context', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.updateTermContext(req.params.projectId, req.params.termId, req.body.context, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}/translations/{langCode}:
 *   put:
 *     summary: Update a translation for a term in the current branch
 *     tags: [Translations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: langCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Translation updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project, branch, or term not found
 */
router.put('/:projectId/terms/:termId/translations/:langCode', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.updateTranslation(req.params.projectId, req.params.termId, req.params.langCode, req.body.value, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});


// --- Comments ---

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}/comments:
 *   get:
 *     summary: Get all comments for a term
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: A list of comments for the term.
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Comment'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project not found
 */
router.get('/:projectId/terms/:termId/comments', authenticate, async (req, res, next) => {
    try {
        const comments = await ProjectDao.getCommentsForTerm(req.params.projectId, req.params.termId);
        res.json(comments);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/terms/{termId}/comments:
 *   post:
 *     summary: Post a new comment on a term
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               parentId: { type: string, nullable: true }
 *     responses:
 *       '201':
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Comment'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or term not found
 */
router.post('/:projectId/terms/:termId/comments', authenticate, async (req, res, next) => {
    try {
        const { content, parentId } = req.body;
        const project = await ProjectDao.getProjectById(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        const newComment = await ProjectDao.createComment(
            req.params.projectId,
            req.params.termId,
            content,
            parentId,
            req.user.id,
            project.currentBranchName
        );
        res.status(201).json(newComment);
    } catch (error) {
        next(error);
    }
});

// --- Team ---

/**
 * @swagger
 * /projects/{projectId}/team:
 *   post:
 *     summary: Add a member to a project or invite them if they don't have an account
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional initial languages to assign.
 *     responses:
 *       '200':
 *         description: User added or invitation sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddMemberResult'
 *       '400':
 *         description: User already a member or invitation already sent.
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project not found
 */
router.post('/:projectId/team', authenticate, async (req, res, next) => {
    try {
        const { email, role, languages } = req.body;
        const result = await ProjectDao.addMember(req.params.projectId, email, role, languages, req.user.id);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/invitations/{invitationId}:
 *   delete:
 *     summary: Revoke a pending invitation
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '204':
 *         description: Invitation revoked successfully.
 *       '401': { description: "Unauthorized" }
 *       '403': { description: "Forbidden" }
 *       '404': { description: "Invitation not found" }
 */
router.delete('/:projectId/invitations/:invitationId', authenticate, async (req, res, next) => {
    try {
        if (!(await isProjectAdmin(req.user.id, req.params.projectId))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const success = await ProjectDao.revokeInvitation(req.params.projectId, req.params.invitationId);
        if (success) {
            res.sendStatus(204);
        } else {
            res.status(404).json({ message: 'Invitation not found' });
        }
    } catch (error) {
        next(error);
    }
});


/**
 * @swagger
 * /projects/{projectId}/team/{userId}:
 *   delete:
 *     summary: Remove a member from a project
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Member removed
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or member not found
 */
router.delete('/:projectId/team/:userId', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.removeMember(req.params.projectId, req.params.userId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/team/{userId}/role:
 *   put:
 *     summary: Update a team member's role
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       '204':
 *         description: Role updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or member not found
 */
router.put('/:projectId/team/:userId/role', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.updateMemberRole(req.params.projectId, req.params.userId, req.body.role);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/team/{userId}/languages:
 *   put:
 *     summary: Update languages assigned to a team member
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: A list of language codes
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       '204':
 *         description: Assigned languages updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or member not found
 */
router.put('/:projectId/team/:userId/languages', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.updateMemberLanguages(req.params.projectId, req.params.userId, req.body);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- Branches & Commits (Ordered by specificity) ---

/**
 * @swagger
 * /projects/{projectId}/branches/from-commit:
 *   post:
 *     summary: Create a new branch from a specific commit
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commitId
 *               - newBranchName
 *             properties:
 *               commitId:
 *                 type: string
 *               newBranchName:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Branch created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or commit not found
 *       '409':
 *         description: Branch name already exists
 */
router.post('/:projectId/branches/from-commit', authenticate, async (req, res, next) => {
    try {
        const { commitId, newBranchName } = req.body;
        const newBranch = await ProjectDao.createBranchFromCommit(req.params.projectId, commitId, newBranchName);
        res.status(201).json(newBranch);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/branches/merge:
 *   post:
 *     summary: Merge one branch into another
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceBranchName
 *               - targetBranchName
 *             properties:
 *               sourceBranchName:
 *                 type: string
 *               targetBranchName:
 *                 type: string
 *     responses:
 *       '204':
 *         description: Merge successful. The changes are now in the target branch's working copy and need to be committed.
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or one of the branches not found
 */
router.post('/:projectId/branches/merge', authenticate, async (req, res, next) => {
    try {
        const { sourceBranchName, targetBranchName } = req.body;
        await ProjectDao.mergeBranches(req.params.projectId, sourceBranchName, targetBranchName, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/branches/{branchName}/commits/latest:
 *   delete:
 *     summary: Delete the latest commit of a branch
 *     tags: [Commits]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: branchName
 *         required: true
 *         schema:
 *           type: string
 *           description: The name of the branch. Use URL encoding for slashes.
 *     responses:
 *       '204':
 *         description: Commit deleted successfully
 *       '400':
 *         description: Cannot delete the initial commit
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.delete('/:projectId/branches/:branchName(*)/commits/latest', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.deleteLatestCommit(req.params.projectId, req.params.branchName, req.user.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/branches/{branchName}/commits:
 *   post:
 *     summary: Create a new commit
 *     tags: [Commits]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: branchName
 *         required: true
 *         schema:
 *           type: string
 *           description: The name of the branch to commit to. Use URL encoding for slashes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Commit created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Commit'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.post('/:projectId/branches/:branchName(*)/commits', authenticate, async (req, res, next) => {
    try {
        const { message } = req.body;
        const newCommit = await ProjectDao.createCommit(req.params.projectId, req.params.branchName, message, req.user.id);
        res.status(201).json(newCommit);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/branches/{branchName}:
 *   delete:
 *     summary: Delete a branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: branchName
 *         required: true
 *         schema:
 *           type: string
 *           description: The name of the branch to delete. Use URL encoding for slashes (e.g., feature%2Fnew-branch).
 *     responses:
 *       '204':
 *         description: Branch deleted
 *       '400':
 *         description: Cannot delete the main branch
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or branch not found
 */
router.delete('/:projectId/branches/:branchName(*)', authenticate, async (req, res, next) => {
    try {
        await ProjectDao.deleteBranch(req.params.projectId, req.params.branchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /projects/{projectId}/branches:
 *   post:
 *     summary: Create a new branch from another branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newBranchName
 *               - sourceBranchName
 *             properties:
 *               newBranchName:
 *                 type: string
 *               sourceBranchName:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Branch created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Project or source branch not found
 *       '409':
 *         description: Branch name already exists
 */
router.post('/:projectId/branches', authenticate, async (req, res, next) => {
    try {
        const { newBranchName, sourceBranchName } = req.body;
        const newBranch = await ProjectDao.createBranch(req.params.projectId, newBranchName, sourceBranchName);
        res.status(201).json(newBranch);
    } catch (error) {
        next(error);
    }
});

export default router;