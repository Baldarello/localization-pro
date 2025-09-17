import { User } from '../models/index.js';

export const login = async (email, pass) => {
    const user = await User.findOne({ where: { email } });

    // Check if user exists and if password is valid
    if (user && await user.validPassword(pass)) {
        return user.get({ plain: true });
    }

    // If user not found or password incorrect
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
        settings: { commitNotifications: true } // Default setting
    });
    
    return newUser.get({ plain: true });
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

export const updateUserSettings = async (userId, settings) => {
    const user = await User.findByPk(userId);
    if (user) {
        // Merge settings to preserve other potential settings in the future
        user.settings = { ...user.settings, ...settings };
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
