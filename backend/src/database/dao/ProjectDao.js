import { Project, User, Branch, Commit, TeamMembership, Comment, Notification, Invitation } from '../models/index.js';
import { AVAILABLE_LANGUAGES } from '../../constants.js';
import sequelize from '../Sequelize.js';
import { sendEmail } from '../../helpers/mailer.js';

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
                }
            ]
        }]
    });
    if (!user) return [];

    const sortedProjects = user.projects.sort((a, b) => a.name.localeCompare(b.name));
    return sortedProjects.map(p => formatProject(p));
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

    const t = await sequelize.transaction();
    try {
        // Update team members' language assignments
        for (const user of project.users) {
            if (user.TeamMembership) {
                const currentLangs = user.TeamMembership.languages || [];
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
    const terms = branch.workingTerms;
    const termIndex = terms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        terms[termIndex].text = newText;
        branch.workingTerms = terms;
        branch.changed('workingTerms', true);
        await branch.save();
    }
};

export const updateTermContext = async (projectId, termId, newContext) => {
    const branch = await getCurrentBranch(projectId);
    const terms = branch.workingTerms;
    const termIndex = terms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        terms[termIndex].context = newContext;
        branch.workingTerms = terms;
        branch.changed('workingTerms', true);
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
    const terms = branch.workingTerms;
    const termIndex = terms.findIndex(t => t.id === termId);
    if (termIndex > -1) {
        if (!terms[termIndex].translations) {
            terms[termIndex].translations = {};
        }
        terms[termIndex].translations[langCode] = value;
        branch.workingTerms = terms;
        branch.changed('workingTerms', true);
        await branch.save();
    }
};

export const bulkUpdateTerms = async (projectId, newTerms) => {
    const branch = await getCurrentBranch(projectId);
    branch.workingTerms = newTerms;
    await branch.save();
};


// --- Team Management ---

export const addMember = async (projectId, email, role, languages, inviterId) => {
    const project = await Project.findByPk(projectId);
    if (!project) return { success: false, message: 'Project not found.', code: 'project_not_found' };

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

        const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}`;
        const subject = `You've been invited to collaborate on ${project.name}`;
        const html = `
            <p>Hi there,</p>
            <p><b>${inviter.name}</b> has invited you to join the project "<b>${project.name}</b>" on Localization Manager Pro as a <b>${role}</b>.</p>
            <p>To accept the invitation, please sign up for an account using this email address (${email}).</p>
            <a href="${registrationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Click here to Register</a>
            <br/><br/>
            <p>Thanks,<br/>The Localization Manager Pro Team</p>`;

        sendEmail(email, subject, html);
        
        return { user: null, success: true, message: `Invitation sent to ${email}. They will be added to the project upon registration.` };
    }
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
            <p><small>You are receiving this because you have commit notifications enabled. You can change this in your profile settings.</small></p>
        `;

        project.users.forEach(user => {
            // Send to everyone except the author, if they have notifications enabled.
            if (user.id !== authorId && user.settings?.commitNotifications) {
                sendEmail(user.email, subject, html.replace('Hi there', `Hi ${user.name}`));
            }
        });
    }

    return fullCommit.get({ plain: true });
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
    const t = await sequelize.transaction();
    try {
        const branch = await Branch.findOne({ 
            where: { projectId, name: branchName }, 
            include: [{model: Commit, as: 'commits'}],
            transaction: t
        });
        if (!branch) {
            throw new Error('Branch not found');
        }

        branch.commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (branch.commits.length <= 1) {
            throw new Error('Cannot delete the initial commit');
        }

        const latestCommit = branch.commits[0];
        const newLatestCommit = branch.commits[1];

        branch.workingTerms = newLatestCommit.terms;
        await branch.save({ transaction: t });
        
        await Commit.destroy({ where: { id: latestCommit.id }, transaction: t });

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
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
            if (!existingTargetTerm.translations) {
                existingTargetTerm.translations = {};
            }
            Object.assign(existingTargetTerm.translations, sourceTerm.translations);
        } else {
            targetTerms.push({ ...sourceTerm, id: `term-${Date.now()}-${key}` });
        }
    }
    
    targetBranch.workingTerms = targetTerms;
    targetBranch.changed('workingTerms', true);
    await targetBranch.save();
};

// --- Comments & Notifications ---

export const getCommentsForTerm = async (projectId, termId) => {
    const comments = await Comment.findAll({
        where: { projectId, termId },
        include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'avatarInitials']
        }],
        order: [['createdAt', 'ASC']]
    });
    return comments.map(c => c.get({ plain: true }));
};

const findMentions = (content) => {
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    // remove '@' prefix
    return [...new Set(matches.map(m => m.substring(1)))]; // Return unique emails
};

export const createComment = async (projectId, termId, content, parentId, authorId, branchName) => {
    const project = await Project.findByPk(projectId, { include: [{ model: User, as: 'users' }] });
    if (!project) throw new Error('Project not found');
    
    const branch = await Branch.findOne({ where: { projectId, name: branchName } });
    if (!branch) throw new Error('Branch not found');

    const newComment = await Comment.create({
        id: `comment-${Date.now()}`,
        content,
        termId,
        branchName,
        parentId,
        authorId,
        projectId,
    });

    // Handle mentions: create notifications and send emails
    const mentionedEmails = findMentions(content);
    if (mentionedEmails.length > 0) {
        const projectMemberEmails = new Set(project.users.map(u => u.email));
        const validMentionedUsers = await User.findAll({
            where: { email: mentionedEmails }
        });

        const author = await User.findByPk(authorId);
        const term = branch.workingTerms.find(t => t.id === termId);

        for (const mentionedUser of validMentionedUsers) {
            // Only notify if the mentioned user is part of the project team and is not the author
            if (projectMemberEmails.has(mentionedUser.email) && mentionedUser.id !== authorId) {
                // Create in-app notification
                await Notification.create({
                    id: `notif-${Date.now()}-${mentionedUser.id}`,
                    type: 'mention',
                    read: false,
                    recipientId: mentionedUser.id,
                    commentId: newComment.id,
                });

                // Send email notification if user has them enabled
                if (mentionedUser.settings?.mentionNotifications) {
                    const subject = `You were mentioned in ${project.name}`;
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const html = `
                        <p>Hi ${mentionedUser.name},</p>
                        <p><b>${author.name}</b> mentioned you in a comment on the term "<b>${term?.text || 'a term'}</b>" in the project "<b>${project.name}</b>".</p>
                        <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 1em; color: #666;">
                            <i>${content.replace(/\n/g, '<br>')}</i>
                        </blockquote>
                        <a href="${frontendUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">View Notification</a>
                        <hr>
                        <p><small>You can disable these notifications in your profile settings.</small></p>
                    `;
                    sendEmail(mentionedUser.email, subject, html);
                }
            }
        }
    }

    const fullComment = await Comment.findByPk(newComment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarInitials'] }]
    });

    return fullComment.get({ plain: true });
};