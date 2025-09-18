import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';
import { ApiKeyPermissions } from '../../constants.js';

class ApiKey extends Model {}

ApiKey.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  permissions: {
    type: DataTypes.ENUM(...Object.values(ApiKeyPermissions)),
    allowNull: false,
  },
  keyPrefix: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  secretHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdById: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  // projectId is added via associations
}, {
  sequelize,
  modelName: 'ApiKey',
  timestamps: true, // createdAt, updatedAt
});

export default ApiKey;
