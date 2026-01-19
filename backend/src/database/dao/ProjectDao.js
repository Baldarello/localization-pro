import { Project, User, Branch, Commit, TeamMembership, Comment, Notification, Invitation, ApiKey } from '../models/index.js';
import { AVAILABLE_LANGUAGES } from '../../constants.js';
import sequelize from '../Sequelize.js';
import { sendEmail } from '../../helpers/mailer.js';
import { sendToUser, broadcastBranchUpdate, broadcastCommentUpdate } from '../../config/WebSocketServer.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

class UsageLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageLimitError';
    this.status = 403; // Forbidden
  }
}

class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

// Helper to safely parse JSON fields that might be strings
const parseTerms = (terms) => {
    if (typeof terms === 'string') {
        try {
            const parsed = JSON.parse(terms);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return Array.isArray(terms) ? terms : [];
};

const formatProject = (project) => {
    if (!project) return null;
    const plainProject = project.get({ plain: true });

    // Ensure `languages` is an array
    if (typeof plainProject.languages === 'string') {
        try {
            plainProject.languages = JSON.parse(plainProject.languages);
        } catch (e) {
            plainProject.languages = [];
        }
    }
    if (!Array.isArray(plainProject.languages)) {
        plainProject.languages = [];
    }


    // Format team object as expected by the frontend
    plainProject.team = {};
    if (plainProject.users) {
        plainProject.users.forEach(user => {
            if (user.TeamMembership) {
                let languages = user.TeamMembership.languages;
                // Ensure languages is an array, parsing if it's a string
                if (typeof languages === 'string') {
                    try {
                        languages = JSON.parse(languages);
                    } catch (e) {
                        languages = [];
                    }
                }

                plainProject.team[user.id] = {
                    role: user.TeamMembership.role,
                    // Final fallback to ensure it's an array, handles null/undefined from DB
                    languages: Array.isArray(languages) ? languages : [],
                };
            }
        });
    }
    delete plainProject.users;


    // Process invitations
    plainProject.pendingInvitations = plainProject.invitations || [];
    delete plainProject.invitations;

    // Ensure commits are sorted newest first and JSON fields are parsed
    plainProject.branches?.forEach(branch => {
        // Parse workingTerms for the branch
        branch.workingTerms = parseTerms(branch.workingTerms);
       
        branch.commits?.forEach(commit => {
            // Parse terms for each commit
            commit.terms = parseTerms(commit.terms);
        });

        // Sort commits after parsing
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
            },
            {
                model: ApiKey,
                as: 'apiKeys',
                attributes: { exclude: ['secretHash'] }
            },
            {
                model: Invitation,
                as: 'invitations',
            }
        ]
    });
};

export const getProjectById = async (projectId) => {
    const project = await findProjectById(projectId);
    return formatProject(project);
};

export const getAllProjects = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [{
            model: Project,
            as: 'projects',
            include: [
                { model: Branch, as: 'branches', include: [{ model: Commit, as: 'commits' }] },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'avatarInitials'],
                    through: { attributes: ['role', 'languages'] }
                },
                {
                    model: ApiKey,
                    as: 'apiKeys',
                    attributes: { exclude: ['secretHash'] }
                },
                {
                    model: Invitation,
                    as: 'invitations',
                }
            ]
        }]
    });
    if (!user) return [];

    const sortedProjects = user.projects.sort((a, b) => a.name.localeCompare(b.name));
    return sortedProjects.map(p => formatProject(p));
};

export const createProject = async (name, userId) => {
    if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
        const adminProjectCount = await TeamMembership.count({ where: { userId, role: 'admin' } });
        if (adminProjectCount >= 3) {
            throw new UsageLimitError('You have reached the maximum of 3 projects.');
        }
    }

    const englishLang = AVAILABLE_LANGUAGES.find(l => l.code === 'en') || { code: 'en', name: 'English' };
    const newProject = await Project.create({
        id: `proj-${Date.now()}`,
        name,
        languages: [englishLang],
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

export const deleteProject = async (projectId) => {
    const deletedCount = await Project.destroy({ where: { id: projectId } });
    return deletedCount > 0;
};

export const updateProjectLanguages = async (projectId, newLanguages) => {
    const project = await findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const newLangCodes = newLanguages.map(l => l.code);
    const newDefaultLang = newLangCodes.includes(project.defaultLanguageCode)
        ? project.defaultLanguageCode
        : newLangCodes[0] || '';

    const t = await sequelize.transaction();
    try {
        // Update team members' language assignments
        for (const user of project.users) {
            if (user.TeamMembership) {
                let currentLangs = user.TeamMembership.languages || [];
                if (typeof currentLangs === 'string') {
                    try {
                        currentLangs = JSON.parse(currentLangs);
                    } catch (e) {
                        currentLangs = [];
                    }
                }
                const updatedLangs = currentLangs.filter(code => newLangCodes.includes(code));
                
                // Use a targeted update instead of save() on an incomplete instance
                await TeamMembership.update(
                    { languages: updatedLangs },
                    { 
                        where: { 
                            projectId: projectId, 
                            userId: user.id 
                        },
                        transaction: t 
                    }
                );
            }
        }
        
        project.languages = newLanguages;
        project.defaultLanguageCode = newDefaultLang;
        await project.save({ transaction: t });

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
    
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

    // Ensure workingTerms is an array
    branch.workingTerms = parseTerms(branch.workingTerms);
    
    return branch;
};

export const addTerm = async (projectId, termText, authorId) => {
    const branch = await getCurrentBranch(projectId);

    const trimmedText = termText?.trim();

    if (!trimmedText) {
        throw new ValidationError('Term key cannot be empty.');
    }
    
    // Check for duplicates (case-insensitive)
    const isDuplicate = branch.workingTerms.some(
        (term) => term.text.toLowerCase() === trimmedText.toLowerCase()
    );

    if (isDuplicate) {
        throw new ValidationError(`Term key "${trimmedText}" already exists in this branch.`, 409);
    }

    if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
        if (branch.workingTerms.length >= 5000) {
            throw new UsageLimitError('This project has reached the maximum of 5000 terms.');
        }
    }

    const newTerm = {
        id: `term-${Date.now()}`,
        text: trimmedText,
        translations: {},
    };
    branch.workingTerms = [...branch.workingTerms, newTerm];
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
    return newTerm;
};

export const updateTermText = async (projectId, termId, newText, authorId) => {
    const branch = await getCurrentBranch(projectId);
    const newTerms = branch.workingTerms.map(t => {
        if (t.id === termId) {
            return { ...t, text: newText };
        }
        return t;
    });
    branch.workingTerms = newTerms;
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
};

export const updateTermContext = async (projectId, termId, newContext, authorId) => {
    const branch = await getCurrentBranch(projectId);
    const newTerms = branch.workingTerms.map(t => {
        if (t.id === termId) {
            return { ...t, context: newContext };
        }
        return t;
    });
    branch.workingTerms = newTerms;
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
};

export const deleteTerm = async (projectId, termId, authorId) => {
    const branch = await getCurrentBranch(projectId);
    branch.workingTerms = branch.workingTerms.filter(t => t.id !== termId);
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
};

export const updateTranslation = async (projectId, termId, langCode, value, authorId) => {
    const branch = await getCurrentBranch(projectId);
    const newTerms = branch.workingTerms.map(t => {
        if (t.id === termId) {
            const newTranslations = { ...(t.translations || {}), [langCode]: value };
            return { ...t, translations: newTranslations };
        }
        return t;
    });
    branch.workingTerms = newTerms;
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
};

export const upsertTranslation = async (projectId, termKey, langCode, translation, authorId) => {
    const branch = await getCurrentBranch(projectId);
    const normalizedKey = termKey.trim();
    if (!normalizedKey) {
        throw new ValidationError('Term key cannot be empty.');
    }

    const termIndex = branch.workingTerms.findIndex(t => t.text === normalizedKey);
    let resultAction = 'updated';
    let term;

    if (termIndex > -1) {
        // Update existing term
        term = { ...branch.workingTerms[termIndex] };
        term.translations = { ...term.translations, [langCode]: translation };
        
        // Update specific item in array by creating a new array copy
        const newTerms = [...branch.workingTerms];
        newTerms[termIndex] = term;
        branch.workingTerms = newTerms;
    } else {
        // Create new term
        if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
            if (branch.workingTerms.length >= 5000) {
                throw new UsageLimitError('This project has reached the maximum of 5000 terms.');
            }
        }
        
        resultAction = 'created';
        term = {
            id: `term-${Date.now()}`,
            text: normalizedKey,
            translations: { [langCode]: translation }
        };
        branch.workingTerms = [...branch.workingTerms, term];
    }

    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
    return { term, action: resultAction };
};

export const bulkUpdateTerms = async (projectId, newTerms, authorId) => {
    const branch = await getCurrentBranch(projectId);
    if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
        if (newTerms.length > 5000) {
            throw new UsageLimitError(`This import would result in ${newTerms.length} terms, exceeding the 5000 term limit.`);
        }
    }
    branch.workingTerms = newTerms;
    await branch.save();
    broadcastBranchUpdate(projectId, branch.name, authorId);
};


// --- Team Management ---

export const addMember = async (projectId, email, role, languages, inviterId) => {
    const project = await Project.findByPk(projectId, {
        include: [
            { model: User, as: 'users' },
            { model: Invitation, as: 'invitations' }
        ]
    });
    if (!project) return { success: false, message: 'Project not found.', code: 'project_not_found' };

    if (process.env.ENFORCE_USAGE_LIMITS === 'true') {
        const currentMemberCount = project.users?.length || 0;
        const pendingInvitationCount = project.invitations?.length || 0;
        if (currentMemberCount + pendingInvitationCount >= 5) {
            throw new UsageLimitError('This project has reached the maximum of 5 team members.');
        }
    }

    const inviter = await User.findByPk(inviterId);
    if (!inviter) return { success: false, message: 'Inviting user could not be identified.' };

    const userToAdd = await User.findOne({ where: { email } });

    if (userToAdd) {
        // User exists, so add them directly to the project team.
        const existing = await TeamMembership.findOne({ where: { projectId, userId: userToAdd.id } });
        if (existing) return { user: userToAdd.get({ plain: true }), success: false, message: 'This user is already a member of the project.', code: 'user_exists' };

        await TeamMembership.create({ projectId, userId: userToAdd.id, role, languages });
        return { user: userToAdd.get({ plain: true }), success: true, message: `${userToAdd.name} was added to the project.` };
    } else {
        // User does not exist, so create and send an invitation.
        const existingInvitation = await Invitation.findOne({ where: { email, projectId } });
        if (existingInvitation) {
            return { success: false, message: `An invitation has already been sent to ${email} for this project.`, code: 'invitation_exists' };
        }

        await Invitation.create({
            email,
            projectId,
            role,
            languages,
            invitedById: inviterId
        });

        const registrationUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const subject = `You've been invited to collaborate on ${project.name}`;
        const html = `
            <p>Hi there,</p>
            <p><b>${inviter.name}</b> has invited you to join the project "<b>${project.name}</b>" on TnT as a <b>${role}</b>.</p>
            <p>To accept the invitation, please sign up for an account using this email address (${email}).</p>
            <a href="${registrationUrl}?view=register" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Click here to Register</a>
            <br/><br/>
            <p>Thanks,<br/>The TnT Team</p>`;

        sendEmail(email, subject, html);
        
        return { user: null, success: true, message: `Invitation sent to ${email}. They will be added to the project upon registration.` };
    }
};

export const revokeInvitation = async (projectId, invitationId) => {
    const result = await Invitation.destroy({
        where: {
            id: invitationId,
            projectId: projectId,
        }
    });
    return result > 0; // returns number of rows deleted
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
    
    // Ensure workingTerms is parsed before use
    const workingTerms = parseTerms(branch.workingTerms);

    const newCommit = await Commit.create({
        id: `commit-${Date.now()}`,
        message,
        authorId,
        timestamp: new Date(),
        terms: workingTerms,
        branchId: branch.id,
    });
    
    // Fetch the full commit with its author association to return to the client
    const fullCommit = await Commit.findByPk(newCommit.id, {
        include: [{ model: User, as: 'author' }]
    });
    
    // --- Send notifications ---
    // Fetch the project with all team members to check their notification settings
    const project = await Project.findByPk(projectId, {
        include: [{ 
            model: User, 
            as: 'users',
            attributes: ['id', 'email', 'name', 'settings'],
        }]
    });

    if (project && project.users) {
        const author = fullCommit.author;
        const subject = `New commit in ${project.name} on branch "${branchName}"`;
        const html = `
            <p>Hi there,</p>
            <p>A new commit has been made in <strong>${project.name}</strong> on branch "<strong>${branchName}</strong>" by <strong>${author.name}</strong>.</p>
            <p><strong>Message:</strong> ${message}</p>
            <p>You can view the changes in the project's history tab.</p>
            <hr>
            <p><small>You are receiving this because you have commit notifications enabled.</small></p>`;

        project.users.forEach(user => {
            // Check settings and don't send to the author of the commit
            if (user.id !== authorId && user.settings?.commitNotifications) {
                sendEmail(user.email, subject, html);
            }
        });
    }

    broadcastBranchUpdate(projectId, branchName, authorId);

    return fullCommit.get({ plain: true });
};

export const deleteLatestCommit = async (projectId, branchName, authorId) => {
    const branch = await Branch.findOne({ where: { projectId, name: branchName }, include: [{ model: Commit, as: 'commits' }] });
    if (!branch) throw new Error('Branch not found');

    branch.commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (branch.commits.length <= 1) {
        throw new Error('Cannot delete the initial commit.');
    }

    const latestCommit = branch.commits[0];
    const parentCommit = branch.commits[1];

    await Commit.destroy({ where: { id: latestCommit.id } });
    branch.workingTerms = parentCommit.terms;
    await branch.save();
    broadcastBranchUpdate(projectId, branchName, authorId);
};

export const createBranch = async (projectId, newBranchName, sourceBranchName) => {
    const sourceBranch = await Branch.findOne({ where: { projectId, name: sourceBranchName }, include: [{ model: Commit, as: 'commits' }] });
    if (!sourceBranch) throw new Error('Source branch not found');

    // Ensure workingTerms is an array, not a string, before copying.
    const workingTermsToCopy = parseTerms(sourceBranch.workingTerms);

    const newBranch = await Branch.create({ name: newBranchName, projectId: projectId, workingTerms: workingTermsToCopy });
    
    // Copy commits from source to new branch
    sourceBranch.commits.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Oldest first for copying
    for (const commit of sourceBranch.commits) {
        await Commit.create({
            ...commit.get({ plain: true }),
            id: `commit-${Date.now()}-${Math.random()}`, // new ID
            branchId: newBranch.id,
        });
    }

    return newBranch.get({ plain: true });
};

export const updateBranchProtection = async (projectId, branchName, isProtected, authorId) => {
    const branch = await Branch.findOne({ where: { projectId, name: branchName } });
    if (!branch) {
        throw new ValidationError('Branch not found', 404);
    }
    branch.isProtected = isProtected;
    await branch.save();
    // Although this doesn't change terms, it's a branch property change.
    // Broadcasting ensures other clients with BranchManager open see the change.
    broadcastBranchUpdate(projectId, branchName, authorId);
};

export const createBranchFromCommit = async (projectId, commitId, newBranchName) => {
    const commit = await Commit.findByPk(commitId);
    if (!commit) throw new Error('Commit not found');

    const newBranch = await Branch.create({ name: newBranchName, projectId, workingTerms: commit.terms });
    await Commit.create({
        id: `commit-${Date.now()}`,
        message: `Initial commit for branch "${newBranchName}" from commit ${commitId.slice(0, 7)}`,
        authorId: commit.authorId,
        timestamp: new Date(),
        terms: commit.terms,
        branchId: newBranch.id,
    });

    return newBranch.get({ plain: true });
};

export const deleteBranch = async (projectId, branchName) => {
    if (branchName === 'main') throw new Error('Cannot delete the main branch');
    await Branch.destroy({ where: { projectId, name: branchName } });
};

export const mergeBranches = async (projectId, sourceBranchName, targetBranchName, authorId) => {
    const t = await sequelize.transaction();
    try {
        const sourceBranch = await Branch.findOne({ where: { projectId, name: sourceBranchName }, transaction: t });
        const targetBranch = await Branch.findOne({ where: { projectId, name: targetBranchName }, transaction: t });
        if (!sourceBranch || !targetBranch) {
            throw new Error('One or both branches not found');
        }

        const sourceTermsList = parseTerms(sourceBranch.workingTerms);
        const targetTermsList = parseTerms(targetBranch.workingTerms);

        // Merge strategy based on term ID. Source branch takes precedence.
        const mergedTermsMap = new Map(targetTermsList.map(term => [term.id, term]));
        for (const sourceTerm of sourceTermsList) {
            mergedTermsMap.set(sourceTerm.id, sourceTerm);
        }
        
        const mergedTerms = Array.from(mergedTermsMap.values());
        
        targetBranch.workingTerms = mergedTerms;
        await targetBranch.save({ transaction: t });

        // Automatically create a commit for the merge
        const commitMessage = `Merge branch '${sourceBranchName}' into ${targetBranchName}`;
        await Commit.create({
            id: `commit-${Date.now()}`,
            message: commitMessage,
            authorId: authorId,
            timestamp: new Date(),
            terms: mergedTerms, // The state after the merge
            branchId: targetBranch.id,
        }, { transaction: t });
        
        await t.commit();

        // Broadcast update after successful transaction
        broadcastBranchUpdate(projectId, targetBranch.name, authorId);

    } catch (error) {
        await t.rollback();
        console.error("Merge failed, transaction rolled back:", error);
        throw error;
    }
};


// --- Comments & Notifications ---
export const getCommentsForTerm = async (projectId, termId) => {
    return await Comment.findAll({
        where: { projectId, termId },
        include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarInitials'] }],
        order: [['createdAt', 'ASC']],
    });
};

export const createComment = async (projectId, termId, content, parentId, authorId, branchName) => {
    const newComment = await Comment.create({
        id: `comment-${Date.now()}`,
        content,
        termId,
        projectId,
        parentId,
        authorId,
        branchName
    });

    // Handle @mentions
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const mentionedEmails = new Set(Array.from(content.matchAll(mentionRegex), m => m[1]));

    if (mentionedEmails.size > 0) {
        const usersToNotify = await User.findAll({ where: { email: Array.from(mentionedEmails) } });
        for (const user of usersToNotify) {
            // Don't notify the user who wrote the comment
            if (user.id === authorId) continue;

            const notification = await Notification.create({
                id: `notif-${Date.now()}-${user.id}`,
                recipientId: user.id,
                commentId: newComment.id,
                type: 'mention'
            });

            // Send real-time notification via WebSocket
            sendToUser(user.id, { type: 'new_notification', payload: notification });

            // Send email notification if enabled
            if (user.settings?.mentionNotifications) {
                const author = await User.findByPk(authorId);
                const project = await Project.findByPk(projectId);
                const subject = `${author.name} mentioned you in ${project.name}`;
                const html = `
                    <p>Hi ${user.name},</p>
                    <p>${author.name} mentioned you in a comment on the term "<strong>${termId}</strong>" in the project "<strong>${project.name}</strong>".</p>
                    <blockquote>${content.replace(/\n/g, '<br>')}</blockquote>
                    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Click here to view the comment.</a></p>
                    <hr>
                    <p><small>You are receiving this because you have mention notifications enabled.</small></p>`;
                sendEmail(user.email, subject, html);
            }
        }
    }

    broadcastCommentUpdate(projectId, branchName, termId, authorId);

    return await Comment.findByPk(newComment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarInitials'] }]
    });
};

// --- API Keys ---

const generateId = (code) => {
    const hash = crypto.createHash('sha1').update(code).digest('hex');
    return `${hash.substr(0, 8)}-${hash.substr(8, 4)}-${hash.substr(12, 4)}-${hash.substr(16, 4)}-${hash.substr(20, 12)}`;
};

export const getLocalesForProject = async (projectId) => {
    const project = await Project.findByPk(projectId);
    if (!project) return null;

    let languages = [];
    if (typeof project.languages === 'string') {
        try {
            languages = JSON.parse(project.languages);
        } catch (e) {
            languages = [];
        }
    } else {
        languages = project.languages;
    }

    if (!Array.isArray(languages)) return [];

    const now = project.createdAt;

    return languages.map(lang => ({
        id: generateId(lang.code + projectId), // Make ID unique per project-locale combo
        name: `${lang.name}_V1`,
        localeId: generateId(lang.code),
        projectSeedId: projectId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        language: lang.name.toLowerCase(),
        code: lang.code,
        region: null,
    }));
};

export const getApiKeysForProject = async (projectId) => {
    return await ApiKey.findAll({
        where: { projectId },
        attributes: { exclude: ['secretHash'] },
        order: [['createdAt', 'DESC']]
    });
};

export const createApiKey = async (projectId, { name, permissions }, createdById) => {
    const prefix = `tnt_key_${crypto.randomBytes(12).toString('hex')}`;
    const secret = `tnt_sec_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = await bcrypt.hash(secret, 10);

    const newKey = await ApiKey.create({
        id: `key-${Date.now()}`,
        name,
        permissions,
        projectId,
        keyPrefix: prefix,
        secretHash,
        createdById,
    });

    // Return the full key object WITH the raw secret, only on creation
    const plainKey = newKey.get({ plain: true });
    delete plainKey.secretHash;
    plainKey.secret = secret;
    return plainKey;
};

export const deleteApiKey = async (projectId, keyId) => {
    await ApiKey.destroy({ where: { projectId, id: keyId } });
};

export const validateAndGetUserFromApiKey = async (prefix, secret) => {
    const apiKey = await ApiKey.findOne({ where: { keyPrefix: prefix }, include: [{model: User, as: 'createdBy'}] });
    if (!apiKey) return null;

    const isValid = await bcrypt.compare(secret, apiKey.secretHash);
    if (!isValid) return null;

    // Update last used timestamp (don't wait for it to complete)
    apiKey.update({ lastUsedAt: new Date() }).catch(err => console.error("Failed to update API key lastUsedAt:", err));

    // Return a plain user object similar to what passport expects
    return apiKey.createdBy.get({ plain: true });
};


// API v0 methods (for compatibility)

export const findLastModifiedTranslation = async (projectId, langCode, branchName = 'main') => {
    const project = await Project.findByPk(projectId, {
        include: [{ model: Branch, as: 'branches', where: { name: branchName }, include: [{ model: Commit, as: 'commits' }] }]
    });

    if (!project || !project.branches || project.branches.length === 0) return null;

    const branch = project.branches[0];
    if (!branch.commits || branch.commits.length === 0) return null;

    branch.commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (let i = 0; i < branch.commits.length; i++) {
        const currentCommit = branch.commits[i];
        const parentCommit = i + 1 < branch.commits.length ? branch.commits[i + 1] : null;

        const currentTerms = parseTerms(currentCommit.terms);
        const parentTerms = parentCommit ? parseTerms(parentCommit.terms) : [];

        const currentTranslations = new Map(currentTerms.map(t => [t.id, t.translations?.[langCode]]).filter(t => t[1] !== undefined));
        const parentTranslations = new Map(parentTerms.map(t => [t.id, t.translations?.[langCode]]).filter(t => t[1] !== undefined));

        let changedTermInfo = null;

        // Check for added or modified translations
        for (const [termId, value] of currentTranslations.entries()) {
            if (parentTranslations.get(termId) !== value) {
                changedTermInfo = { termId, value };
                break;
            }
        }

        // If no additions/modifications, check for removed translations
        if (!changedTermInfo) {
            for (const termId of parentTranslations.keys()) {
                if (!currentTranslations.has(termId)) {
                    changedTermInfo = { termId, value: undefined }; // Represents a removal
                    break;
                }
            }
        }

        // If a change was found in this commit, it's the most recent one.
        if (changedTermInfo) {
            return {
                id: `${changedTermInfo.termId}-${langCode}`,
                value: changedTermInfo.value,
                localeId: langCode,
                termId: changedTermInfo.termId,
                createdAt: currentCommit.timestamp,
                updatedAt: currentCommit.timestamp
            };
        }
    }

    return null; // No changes found for this locale in the branch's history.
};

export const getTermsForLocale = async (projectId, langCode, branchName = 'main') => {
    const project = await Project.findByPk(projectId, {
        include: [{ model: Branch, as: 'branches', where: { name: branchName }, include: [{ model: Commit, as: 'commits' }] }]
    });
    if (!project || !project.branches || project.branches.length === 0) return null;

    const branch = project.branches[0];
    branch.commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const latestCommit = branch.commits[0];
    if (!latestCommit) return {};

    const translations = {};
    const terms = parseTerms(latestCommit.terms);
    for (const term of terms) {
        if (term.translations && term.translations[langCode]) {
            translations[term.text] = term.translations[langCode];
        }
    }
    return translations;
};