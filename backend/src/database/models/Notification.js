import { DataTypes, Model } from 'sequelize';
import sequelize from '../Sequelize.js';

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'mention',
  },
  // recipientId, commentId are added via associations
}, {
  sequelize,
  modelName: 'Notification',
  timestamps: true,
});

export default Notification;
