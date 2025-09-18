'use strict';

const { UserRole, ApiKeyPermissions } = require('../../constants.js');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Using a transaction ensures that all tables are created or none are.
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create Users table
      await queryInterface.createTable('Users', {
        id: { type: Sequelize.STRING, primaryKey: true },
        googleId: { type: Sequelize.STRING, unique: true, allowNull: true },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        avatarInitials: { type: Sequelize.STRING },
        password: { type: Sequelize.STRING, allowNull: true },
        settings: { type: Sequelize.JSON },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });

      // Create Projects table
      await queryInterface.createTable('Projects', {
        id: { type: Sequelize.STRING, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        defaultLanguageCode: { type: Sequelize.STRING, allowNull: false },
        languages: { type: Sequelize.JSON, allowNull: false },
        currentBranchName: { type: Sequelize.STRING, allowNull: false, defaultValue: 'main' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Create Branches table
      await queryInterface.createTable('Branches', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        workingTerms: { type: Sequelize.JSON, allowNull: false, defaultValue: '[]' },
        projectId: {
          type: Sequelize.STRING,
          references: { model: 'Projects', key: 'id' },
          onDelete: 'CASCADE',
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });
      await queryInterface.addIndex('Branches', ['name', 'projectId'], { unique: true, transaction });

      // Create Commits table
      await queryInterface.createTable('Commits', {
        id: { type: Sequelize.STRING, primaryKey: true },
        message: { type: Sequelize.STRING, allowNull: false },
        timestamp: { type: Sequelize.DATE, allowNull: false },
        terms: { type: Sequelize.JSON, allowNull: false, defaultValue: '[]' },
        authorId: { type: Sequelize.STRING, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        branchId: { type: Sequelize.INTEGER, references: { model: 'Branches', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });

      // Create TeamMemberships table (join table)
      await queryInterface.createTable('TeamMemberships', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        role: { type: Sequelize.ENUM(...Object.values(UserRole)), allowNull: false },
        languages: { type: Sequelize.JSON, allowNull: false, defaultValue: '[]' },
        userId: { type: Sequelize.STRING, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
        projectId: { type: Sequelize.STRING, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });

      // Create Comments table
      await queryInterface.createTable('Comments', {
        id: { type: Sequelize.STRING, primaryKey: true },
        content: { type: Sequelize.TEXT, allowNull: false },
        termId: { type: Sequelize.STRING, allowNull: false },
        branchName: { type: Sequelize.STRING, allowNull: false },
        parentId: { type: Sequelize.STRING, allowNull: true, references: { model: 'Comments', key: 'id' }, onDelete: 'SET NULL' },
        authorId: { type: Sequelize.STRING, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        projectId: { type: Sequelize.STRING, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Create Notifications table
      await queryInterface.createTable('Notifications', {
        id: { type: Sequelize.STRING, primaryKey: true },
        read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        type: { type: Sequelize.STRING, allowNull: false, defaultValue: 'mention' },
        recipientId: { type: Sequelize.STRING, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
        commentId: { type: Sequelize.STRING, references: { model: 'Comments', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Create Invitations table
      await queryInterface.createTable('Invitations', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        email: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.ENUM(...Object.values(UserRole)), allowNull: false },
        languages: { type: Sequelize.JSON, allowNull: false, defaultValue: '[]' },
        projectId: { type: Sequelize.STRING, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
        invitedById: { type: Sequelize.STRING, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('Invitations', ['email', 'projectId'], { unique: true, transaction });

      // Create ApiKeys table
      await queryInterface.createTable('ApiKeys', {
        id: { type: Sequelize.STRING, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        permissions: { type: Sequelize.ENUM(...Object.values(ApiKeyPermissions)), allowNull: false },
        keyPrefix: { type: Sequelize.STRING, allowNull: false, unique: true },
        secretHash: { type: Sequelize.STRING, allowNull: false },
        lastUsedAt: { type: Sequelize.DATE, allowNull: true },
        projectId: { type: Sequelize.STRING, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop tables in reverse order of creation to respect foreign key constraints
      await queryInterface.dropTable('ApiKeys', { transaction });
      await queryInterface.dropTable('Invitations', { transaction });
      await queryInterface.dropTable('Notifications', { transaction });
      await queryInterface.dropTable('Comments', { transaction });
      await queryInterface.dropTable('TeamMemberships', { transaction });
      await queryInterface.dropTable('Commits', { transaction });
      await queryInterface.dropTable('Branches', { transaction });
      await queryInterface.dropTable('Projects', { transaction });
      await queryInterface.dropTable('Users', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
