import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';

class Commit extends Model {}

Commit.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  terms: {
    type: DataTypes.JSON, // Stores the snapshot of Term objects
    allowNull: false,
    defaultValue: [],
  },
  // authorId and branchId are added via associations
}, {
  sequelize,
  modelName: 'Commit',
  timestamps: false,
});

export default Commit;
