import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';

class User extends Model {}

User.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
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
  // In a real app, this should be a hashed password and a salt
  password: {
    type: DataTypes.STRING,
    defaultValue: 'password', // For mock purposes
  },
}, {
  sequelize,
  modelName: 'User',
  timestamps: false,
});

export default User;
