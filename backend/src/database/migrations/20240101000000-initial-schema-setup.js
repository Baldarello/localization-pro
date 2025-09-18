import { DataTypes } from 'sequelize';
import { UserRole } from '../../constants.js';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Users', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    googleId: { type: DataTypes.STRING, unique: true, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    avatarInitials: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING, allowNull: true },
    settings: { type: DataTypes.JSON, defaultValue: { commitNotifications: true, mentionNotifications: true } },
  });

  await queryInterface.createTable('Projects', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    defaultLanguageCode: { type: DataTypes.STRING, allowNull: false },
    languages: { type: DataTypes.JSON, allowNull: false },
    currentBranchName: { type: DataTypes.STRING, allowNull: false, defaultValue: 'main' },
    createdAt: { allowNull: false, type: DataTypes.DATE },
    updatedAt: { allowNull: false, type: DataTypes.DATE },
  });

  await queryInterface.createTable('Branches', {
    id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, allowNull: false },
    workingTerms: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    projectId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
  });
  await queryInterface.addIndex('Branches', ['name', 'projectId'], { unique: true, name: 'branches_name_project_id' });

  await queryInterface.createTable('Commits', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    terms: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    authorId: { type: DataTypes.STRING, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Branches', key: 'id' }, onDelete: 'CASCADE' },
  });
  
  await queryInterface.createTable('TeamMemberships', {
    id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER },
    role: { type: DataTypes.ENUM(...Object.values(UserRole)), allowNull: false },
    languages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    userId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
    projectId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
  });

  await queryInterface.createTable('ApiKeys', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    permissions: { type: DataTypes.ENUM('readonly', 'edit', 'admin'), allowNull: false },
    keyPrefix: { type: DataTypes.STRING, allowNull: false, unique: true },
    secretHash: { type: DataTypes.STRING, allowNull: false },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { allowNull: false, type: DataTypes.DATE },
    updatedAt: { allowNull: false, type: DataTypes.DATE },
    projectId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
    createdById: { type: DataTypes.STRING, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
  });

  await queryInterface.createTable('Comments', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    termId: { type: DataTypes.STRING, allowNull: false },
    branchName: { type: DataTypes.STRING, allowNull: false },
    parentId: { type: DataTypes.STRING, allowNull: true, references: { model: 'Comments', key: 'id' }, onDelete: 'SET NULL' },
    authorId: { type: DataTypes.STRING, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
    projectId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: { allowNull: false, type: DataTypes.DATE },
    updatedAt: { allowNull: false, type: DataTypes.DATE },
  });

  await queryInterface.createTable('Invitations', {
    id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER },
    email: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...Object.values(UserRole)), allowNull: false },
    languages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    invitedById: { type: DataTypes.STRING, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
    projectId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: { allowNull: false, type: DataTypes.DATE },
    updatedAt: { allowNull: false, type: DataTypes.DATE },
  });
  await queryInterface.addIndex('Invitations', ['email', 'projectId'], { unique: true, name: 'invitations_email_project_id' });

  await queryInterface.createTable('Notifications', {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'mention' },
    recipientId: { type: DataTypes.STRING, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
    commentId: { type: DataTypes.STRING, allowNull: true, references: { model: 'Comments', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: { allowNull: false, type: DataTypes.DATE },
    updatedAt: { allowNull: false, type: DataTypes.DATE },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Notifications');
  await queryInterface.removeIndex('Invitations', 'invitations_email_project_id');
  await queryInterface.dropTable('Invitations');
  await queryInterface.dropTable('Comments');
  await queryInterface.dropTable('ApiKeys');
  await queryInterface.dropTable('TeamMemberships');
  await queryInterface.dropTable('Commits');
  await queryInterface.removeIndex('Branches', 'branches_name_project_id');
  await queryInterface.dropTable('Branches');
  await queryInterface.dropTable('Projects');
  await queryInterface.dropTable('Users');
}