import { User, Notification, Comment, Invitation, TeamMembership } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

export const login = async (email, pass) => {
    const user = await User.findOne({ where: { email } });

    // Check if user exists and if password is valid
    if (user && await user.validPassword(pass)) {
        // Exclude password hash from returned user object
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }

    // If user not found or password incorrect
    return null;
};

export const findOrCreateGoogleUser = async (profile) => {
    const { id: googleId, displayName, emails } = profile;
    const email = emails[0].value;

    // 1. Find user by Google ID first
    let user = await User.findOne({ where: { googleId } });
    if (user) {
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }

    // 2. If not found, try to find by email to link the account
    user = await User.findOne({ where: { email } });
    if (user) {
        user.googleId = googleId;
        await user.save();
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }

    // 3. If no user is found by email, create a new one
    const nameParts = displayName.split(' ');
    const avatarInitials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : displayName.substring(0, 2).toUpperCase();

    // Password field is omitted and will be null for OAuth users
    const newUser = await User.create({
        id: `user-${Date.now()}`,
        googleId,
        name: displayName,
        email,
        avatarInitials,
        settings: { commitNotifications: true, mentionNotifications: true }
    });
    
    const { password, ...userWithoutPassword } = newUser.get({ plain: true });
    return userWithoutPassword;
};

export const getUserById = async (userId) => {
    const user = await User.findByPk(userId);
    if (user) {
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }
    return null;
};

export const getAllUsers = async () => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] }
    });
    return users.map(u => u.get({ plain: true }));
};

export const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

export const registerUser = async (name, email, password) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }

    const nameParts = name.split(' ');
    const avatarInitials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    
    // The beforeCreate hook will hash the password
    const newUser = await User.create({
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        avatarInitials,
        settings: { commitNotifications: true, mentionNotifications: true }
    });

    // --- NEW: Check for and process pending invitations ---
    const pendingInvitations = await Invitation.findAll({ where: { email: newUser.email } });

    if (pendingInvitations.length > 0) {
        for (const invitation of pendingInvitations) {
            // Add user to the project team
            await TeamMembership.create({
                projectId: invitation.projectId,
                userId: newUser.id,
                role: invitation.role,
                languages: invitation.languages,
            });

            // Delete the consumed invitation
            await invitation.destroy();
        }
    }
    
    const { password: _, ...userWithoutPassword } = newUser.get({ plain: true });
    return userWithoutPassword;
};

export const updateUserName = async (userId, newName) => {
    const user = await User.findByPk(userId);
    if (user) {
        user.name = newName;
        const nameParts = newName.split(' ');
        user.avatarInitials = nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : newName.substring(0, 2).toUpperCase();
        await user.save();
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }
    return null;
};

export const updateUserSettings = async (userId, settings) => {
    const user = await User.findByPk(userId);
    if (user) {
        // Merge settings to preserve other potential settings in the future
        user.settings = { ...user.settings, ...settings };
        await user.save();
        const { password, ...userWithoutPassword } = user.get({ plain: true });
        return userWithoutPassword;
    }
    return null;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) {
        return { success: false, message: 'User not found.' };
    }

    if (!user.password) {
        return { success: false, message: 'Cannot change password for an account created with Google Sign-In.' };
    }
    
    // Validate the current password
    const isMatch = await user.validPassword(currentPassword);
    if (!isMatch) {
        return { success: false, message: 'Current password is incorrect.' };
    }

    // Set the new password. The `beforeUpdate` hook on the User model
    // will automatically hash it before saving.
    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password updated successfully.' };
};

export const getNotificationsForUser = async (userId) => {
    const notifications = await Notification.findAll({
        where: { recipientId: userId },
        include: [{
            model: Comment,
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'avatarInitials']
            }]
        }],
        order: [['createdAt', 'DESC']]
    });
    return notifications.map(n => {
        const plain = n.get({ plain: true });
        // The frontend expects projectId, termId, branchName on the notification
        // Let's add them from the comment
        if (plain.Comment) { // Note: Sequelize uses model name as property by default
            plain.comment = plain.Comment; // Alias for frontend consistency
            plain.projectId = plain.Comment.projectId;
            plain.termId = plain.Comment.termId;
            plain.branchName = plain.Comment.branchName;
            delete plain.Comment;
        }
        return plain;
    });
};

export const markNotificationsAsRead = async (userId, notificationIds) => {
    await Notification.update(
        { read: true },
        { where: { recipientId: userId, id: { [Op.in]: notificationIds } } }
    );
};