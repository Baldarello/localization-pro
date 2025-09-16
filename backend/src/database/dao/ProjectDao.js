import { Project, User, Branch, Commit, TeamMembership } from '../models/index.js';
import { AVAILABLE_LANGUAGES } from '../../constants.js';
import { col, fn } from 'sequelize';

const formatProject = (project) => {
    if (!project) return null;
    const plainProject = project.get({ plain: true });

    // Format team object as expected by the frontend
    plainProject.team = {};
    if (plainProject.users) {
        plainProject.users.forEach(user => {
            plainProject.team[user.id] = {
                role: user.TeamMembership.role,
                languages: user.TeamMembership.languages,
            };
        });
    }
    delete plainProject.users;

    // Ensure commits are sorted newest first
    plainProject.branches?.forEach(branch => {
        branch.commits?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return plainProject;
};


const findProjectById = async (projectId) => {
    return await Project.findByPk(projectId, {
        include: [
            {
                model: Branch,
                as: 'branches',
                include: [{ model: Commit, as: 'commits', include: [{model: User, as: 'author'}] }],
            },
            {
                model: User,
                as: 'users',
                attributes: ['id', 'name', 'email', 'avatarInitials'],
                through: { attributes: ['role', 'languages'] }
            }
        ]
    });
};

export const getAllProjects = async () => {
    const projects = await Project.findAll({
        include: [
            { model: Branch, as: 'branches', include: [{ model: Commit, as: 'commits' }] },
            { model: User, as: 'users', through: { attributes: [] } } // For team member count
        ]
    });
    // This is a simplified version for the dashboard card.
    return projects.map(p => formatProject(p));
};

export const createProject = async (name, userId) => {
    const newProject = await Project.create({
        id: `proj-${Date.now()}`,
        name,
        languages: [AVAILABLE_LANGUAGES[0]],
        defaultLanguageCode: 'en',
        currentBranchName: 'main',
    });
    
    await TeamMembership.create({
        projectId: newProject.id,
        userId: userId,
        role: 'admin',
        languages: ['en']
    });

    const mainBranch = await Branch.create({ name: 'main', projectId: newProject.id, workingTerms: [] });
    await Commit.create({
        id: `commit-${Date.now()}`,
        message: 'Initial commit',
        authorId: userId,
        timestamp: new Date(),
        terms: [],
        branchId: mainBranch.id
    });

    const fullProject = await findProjectById(newProject.id);
    return formatProject(fullProject);
};

export const updateProjectLanguages = async (projectId, newLanguages) => {
    const project = await findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const newLangCodes = newLanguages.map(l => l.code);
    const newDefaultLang = newLangCodes.includes(project.defaultLanguageCode)
        ? project.defaultLanguageCode
        : newLangCodes[0] || '';

    // Update team members' language assignments
    for (const user of project.users) {
        const updatedLangs = user.TeamMembership.languages.filter(code => newLangCodes.includes(code));
        user.TeamMembership.languages = updatedLangs;
        await user.TeamMembership.save();
    }
    
    project.languages = newLanguages;
    project.defaultLanguageCode = newDefaultLang;
    await project.save();
    
    const updatedProject = await findProjectById(projectId);
    return formatProject(updatedProject);
};

export const setDefaultLanguage = async (projectId, langCode) => {
    await Project.update({ defaultLanguageCode: langCode }, { where: { id: projectId } });
};

export const switchBranch = async (projectId, branchName) => {
    await Project.update({ currentBranchName: branchName }, { where: { id: projectId } });
};


// --- Terms and Translations ---
const getCurrentBranch = async (projectId) => {
    const project = await Project.findByPk(projectId);
    if (!project) throw new Error('Project not found');
    const branch = await Branch.findOne({ where: { projectId, name: project.currentBranchName } });
    if (!branch) throw new Error('Current branch not found');
    return branch;
};

export const addTerm = async (projectId, termText) => {
    const branch = await getCurrentBranch(projectId);
    const newTerm = {
        id: `term-${Date.now()}`,
        text: termText,
        translations: {},
    };
    branch.workingTerms = [...branch.workingTerms, newTerm];
    await branch.save();
    return newTerm;
};

export const updateTermText = async (projectId, termId, newText) => {
    const branch = await getCurrentBranch(projectId);
    const termIndex = branch.workingTerms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        branch.workingTerms[termIndex].text = newText;
        branch.workingTerms = [...branch.workingTerms]; // Trigger sequelize update
        await branch.save();
    }
};

export const updateTermContext = async (projectId, termId, newContext) => {
    const branch = await getCurrentBranch(projectId);
    const termIndex = branch.workingTerms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        branch.workingTerms[termIndex].context = newContext;
        branch.workingTerms = [...branch.workingTerms];
        await branch.save();
    }
};

export const deleteTerm = async (projectId, termId) => {
    const branch = await getCurrentBranch(projectId);
    branch.workingTerms = branch.workingTerms.filter(t => t.id !== termId);
    await branch.save();
};

export const updateTranslation = async (projectId, termId, langCode, value) => {
    const branch = await getCurrentBranch(projectId);
    const termIndex = branch.workingTerms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        branch.workingTerms[termIndex].translations[langCode] = value;
        branch.workingTerms = [...branch.workingTerms];
        await branch.save();
    }
};

// --- Team Management ---

export const addMember = async (projectId, email, role, languages) => {
    const project = await Project.findByPk(projectId);
    if (!project) return { success: false, message: 'Project not found.', code: 'project_not_found' };

    const userToAdd = await User.findOne({ where: { email } });
    if (!userToAdd) return { success: false, message: 'No user found with this email address.', code: 'user_not_found' };
    
    const existing = await TeamMembership.findOne({ where: { projectId, userId: userToAdd.id } });
    if (existing) return { user: userToAdd.get({plain: true}), success: false, message: 'This user is already a member of the project.', code: 'user_exists' };

    await TeamMembership.create({ projectId, userId: userToAdd.id, role, languages });
    return { user: userToAdd.get({plain: true}), success: true, message: `${userToAdd.name} was added to the project.` };
};

export const removeMember = async (projectId, userId) => {
    await TeamMembership.destroy({ where: { projectId, userId } });
};

export const updateMemberRole = async (projectId, userId, role) => {
    await TeamMembership.update({ role }, { where: { projectId, userId } });
};

export const updateMemberLanguages = async (projectId, userId, languages) => {
    await TeamMembership.update({ languages }, { where: { projectId, userId } });
};

// --- Branching and Commits ---

export const createCommit = async (projectId, branchName, message, authorId) => {
    const branch = await Branch.findOne({ where: { projectId, name: branchName } });
    if (!branch) throw new Error('Branch not found');
    
    const newCommit = await Commit.create({
        id: `commit-${Date.now()}`,
        message,
        authorId,
        timestamp: new Date(),
        terms: branch.workingTerms,
        branchId: branch.id,
    });
    
    return newCommit.get({ plain: true });
};

export const createBranch = async (projectId, newBranchName, sourceBranchName) => {
    const sourceBranch = await Branch.findOne({ where: { projectId, name: sourceBranchName }, include: [{model: Commit, as: 'commits'}] });
    if (!sourceBranch) throw new Error('Source branch not found');

    sourceBranch.commits.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestCommit = sourceBranch.commits[0];

    const newBranch = await Branch.create({
        name: newBranchName,
        projectId,
        workingTerms: latestCommit ? latestCommit.terms : [],
    });

    if (latestCommit) {
        await Commit.create({ ...latestCommit.get({plain: true}), id: `commit-${Date.now()}`, branchId: newBranch.id });
    }

    return newBranch.get({ plain: true });
};

export const createBranchFromCommit = async (projectId, commitId, newBranchName) => {
    const sourceCommit = await Commit.findByPk(commitId);
    if (!sourceCommit) throw new Error('Source commit not found');

    const newBranch = await Branch.create({
        name: newBranchName,
        projectId,
        workingTerms: sourceCommit.terms,
    });

    await Commit.create({ ...sourceCommit.get({plain: true}), id: `commit-${Date.now()}`, branchId: newBranch.id });
    
    return newBranch.get({ plain: true });
};


export const deleteBranch = async (projectId, branchName) => {
    if (branchName === 'main') throw new Error('Cannot delete the main branch');
    await Branch.destroy({ where: { projectId, name: branchName } });
};

export const deleteLatestCommit = async (projectId, branchName) => {
    const branch = await Branch.findOne({ where: { projectId, name: branchName }, include: [{model: Commit, as: 'commits'}] });
    if (!branch) throw new Error('Branch not found');

    branch.commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (branch.commits.length <= 1) throw new Error('Cannot delete the initial commit');

    const latestCommit = branch.commits[0];
    const newLatestCommit = branch.commits[1];

    branch.workingTerms = newLatestCommit.terms;
    await branch.save();
    await latestCommit.destroy();
};

export const mergeBranches = async (projectId, sourceBranchName, targetBranchName) => {
    const sourceBranch = await Branch.findOne({ where: { projectId, name: sourceBranchName }, include: [{model: Commit, as: 'commits'}] });
    const targetBranch = await Branch.findOne({ where: { projectId, name: targetBranchName } });
    if (!sourceBranch || !targetBranch) throw new Error('Branch not found');

    sourceBranch.commits.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    const sourceTerms = sourceBranch.commits[0]?.terms || [];
    const targetTerms = targetBranch.workingTerms;

    const sourceTermsMap = new Map(sourceTerms.map(t => [t.text, t]));
    const targetTermsMap = new Map(targetTerms.map(t => [t.id, t]));

    for (const [key, sourceTerm] of sourceTermsMap.entries()) {
        const existingTargetTerm = Array.from(targetTermsMap.values()).find(t => t.text === key);
        if (existingTargetTerm) {
            Object.assign(existingTargetTerm.translations, sourceTerm.translations);
        } else {
            targetTerms.push({ ...sourceTerm, id: `term-${Date.now()}-${key}` });
        }
    }
    
    targetBranch.workingTerms = [...targetTerms];
    await targetBranch.save();
};