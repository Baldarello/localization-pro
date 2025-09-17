import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';
import { UserRole } from '../../constants.js';

class Invitation extends Model {}

Invitation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
  },
  languages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  // projectId and invitedById are added via associations
}, {
  sequelize,
  modelName: 'Invitation',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email', 'projectId'] // A user can only be invited to a project once
    }
  ]
});

export default Invitation;
