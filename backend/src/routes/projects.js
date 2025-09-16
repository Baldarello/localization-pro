import { Router } from 'express';
import * as ProjectDao from '../database/dao/ProjectDao.js';

const router = Router();

// --- Projects ---

// GET /api/v1/projects
router.get('/', async (req, res, next) => {
    try {
        const projects = await ProjectDao.getAllProjects();
        res.json(projects);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/projects
router.post('/', async (req, res, next) => {
    try {
        const { name, userId } = req.body;
        const newProject = await ProjectDao.createProject(name, userId);
        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/languages
router.put('/:projectId/languages', async (req, res, next) => {
    try {
        const updatedProject = await ProjectDao.updateProjectLanguages(req.params.projectId, req.body);
        res.json(updatedProject);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/defaultLanguage
router.put('/:projectId/defaultLanguage', async (req, res, next) => {
    try {
        await ProjectDao.setDefaultLanguage(req.params.projectId, req.body.langCode);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/currentBranch
router.put('/:projectId/currentBranch', async (req, res, next) => {
    try {
        await ProjectDao.switchBranch(req.params.projectId, req.body.branchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- Terms ---

// POST /api/v1/projects/:projectId/terms
router.post('/:projectId/terms', async (req, res, next) => {
    try {
        const newTerm = await ProjectDao.addTerm(req.params.projectId, req.body.termText);
        res.status(201).json(newTerm);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/terms/:termId
router.put('/:projectId/terms/:termId', async (req, res, next) => {
    try {
        await ProjectDao.updateTermText(req.params.projectId, req.params.termId, req.body.text);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/projects/:projectId/terms/:termId
router.delete('/:projectId/terms/:termId', async (req, res, next) => {
    try {
        await ProjectDao.deleteTerm(req.params.projectId, req.params.termId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/terms/:termId/context
router.put('/:projectId/terms/:termId/context', async (req, res, next) => {
    try {
        await ProjectDao.updateTermContext(req.params.projectId, req.params.termId, req.body.context);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/terms/:termId/translations/:langCode
router.put('/:projectId/terms/:termId/translations/:langCode', async (req, res, next) => {
    try {
        await ProjectDao.updateTranslation(req.params.projectId, req.params.termId, req.params.langCode, req.body.value);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- Team ---

// POST /api/v1/projects/:projectId/team
router.post('/:projectId/team', async (req, res, next) => {
    try {
        const { email, role, languages } = req.body;
        const result = await ProjectDao.addMember(req.params.projectId, email, role, languages);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/projects/:projectId/team/:userId
router.delete('/:projectId/team/:userId', async (req, res, next) => {
    try {
        await ProjectDao.removeMember(req.params.projectId, req.params.userId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/team/:userId/role
router.put('/:projectId/team/:userId/role', async (req, res, next) => {
    try {
        await ProjectDao.updateMemberRole(req.params.projectId, req.params.userId, req.body.role);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/projects/:projectId/team/:userId/languages
router.put('/:projectId/team/:userId/languages', async (req, res, next) => {
    try {
        await ProjectDao.updateMemberLanguages(req.params.projectId, req.params.userId, req.body);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- Branches ---

// POST /api/v1/projects/:projectId/branches
router.post('/:projectId/branches', async (req, res, next) => {
    try {
        const { newBranchName, sourceBranchName } = req.body;
        const newBranch = await ProjectDao.createBranch(req.params.projectId, newBranchName, sourceBranchName);
        res.status(201).json(newBranch);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/projects/:projectId/branches/:branchName
router.delete('/:projectId/branches/:branchName(*)', async (req, res, next) => {
    try {
        await ProjectDao.deleteBranch(req.params.projectId, req.params.branchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/projects/:projectId/branches/from-commit
router.post('/:projectId/branches/from-commit', async (req, res, next) => {
    try {
        const { commitId, newBranchName } = req.body;
        const newBranch = await ProjectDao.createBranchFromCommit(req.params.projectId, commitId, newBranchName);
        res.status(201).json(newBranch);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/projects/:projectId/branches/merge
router.post('/:projectId/branches/merge', async (req, res, next) => {
    try {
        const { sourceBranchName, targetBranchName } = req.body;
        await ProjectDao.mergeBranches(req.params.projectId, sourceBranchName, targetBranchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// --- Commits ---

// POST /api/v1/projects/:projectId/branches/:branchName/commits
router.post('/:projectId/branches/:branchName(*)/commits', async (req, res, next) => {
    try {
        const { message, authorId } = req.body;
        const newCommit = await ProjectDao.createCommit(req.params.projectId, req.params.branchName, message, authorId);
        res.status(201).json(newCommit);
    } catch (error) {
        next(error);
    }
});


// DELETE /api/v1/projects/:projectId/branches/:branchName/commits/latest
router.delete('/:projectId/branches/:branchName(*)/commits/latest', async (req, res, next) => {
    try {
        await ProjectDao.deleteLatestCommit(req.params.projectId, req.params.branchName);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

export default router;
