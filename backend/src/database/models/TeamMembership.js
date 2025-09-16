import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';
import { UserRole } from '../../constants.js'; // Adjust path

class TeamMembership extends Model {}

TeamMembership.init({
  // id is auto-generated
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
  },
  languages: {
    type: DataTypes.JSON, // Array of lang codes
    allowNull: false,
    defaultValue: [],
  },
  // projectId and userId are added via associations
}, {
  sequelize,
  modelName: 'TeamMembership',
  timestamps: false,
});

export default TeamMembership;