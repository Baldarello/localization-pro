import { User } from '../models/index.js';

export const login = async (email, pass) => {
    // This is a mock login. In a real app, you would hash and compare passwords.
    const user = await User.findOne({ where: { email, password: pass } });
    if (user) {
        // Return a plain object to avoid sending Sequelize instance details
        return user.get({ plain: true });
    }
    return null;
};

export const getUserById = async (userId) => {
    const user = await User.findByPk(userId);
    if (user) {
        return user.get({ plain: true });
    }
    return null;
};

export const getAllUsers = async () => {
    const users = await User.findAll();
    return users.map(u => u.get({ plain: true }));
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
        return user.get({ plain: true });
    }
    return null;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) {
        return { success: false, message: 'User not found.' };
    }
    // Mock password check
    if (user.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
    }
    // In a real app, hash the new password
    user.password = newPassword;
    await user.save();
    return { success: true, message: 'Password updated successfully.' };
};