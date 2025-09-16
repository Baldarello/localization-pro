import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';

class Project extends Model {}

Project.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  defaultLanguageCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  languages: {
    type: DataTypes.JSON, // Storing array of language objects
    allowNull: false,
  },
  currentBranchName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'main',
  },
}, {
  sequelize,
  modelName: 'Project',
  timestamps: true, // Add createdAt and updatedAt
});

export default Project;
