import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';
import bcrypt from 'bcrypt';

class User extends Model {
  // Instance method to validate password
  async validPassword(password) {
    // A user without a password (e.g., created via OAuth) cannot log in with a password.
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  avatarInitials: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for users who sign up via OAuth
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: { commitNotifications: true, mentionNotifications: true },
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
        // Only hash password if it exists
        if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    },
    beforeUpdate: async (user) => {
        // Only hash password if it has changed and exists
        if (user.changed('password') && user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    }
  }
});

export default User;