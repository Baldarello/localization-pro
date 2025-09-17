import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';

class Comment extends Model {}

Comment.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  termId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // authorId, projectId are added via associations
}, {
  sequelize,
  modelName: 'Comment',
  timestamps: true, // createdAt, updatedAt
});

export default Comment;
