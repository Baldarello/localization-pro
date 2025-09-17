import User from './User.js';
import Project from './Project.js';
import Branch from './Branch.js';
import Commit from './Commit.js';
import TeamMembership from './TeamMembership.js';
import Comment from './Comment.js';
import Notification from './Notification.js';


// Project <-> Branch (One-to-Many)
Project.hasMany(Branch, { as: 'branches', foreignKey: 'projectId', onDelete: 'CASCADE' });
Branch.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

// Branch <-> Commit (One-to-Many)
Branch.hasMany(Commit, { as: 'commits', foreignKey: 'branchId', onDelete: 'CASCADE' });
Commit.belongsTo(Branch, { as: 'branch', foreignKey: 'branchId' });

// Commit <-> User (Many-to-One, for author)
User.hasMany(Commit, { foreignKey: 'authorId' });
Commit.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

// User <-> Project (Many-to-Many, through TeamMembership)
User.belongsToMany(Project, { through: TeamMembership, as: 'projects', foreignKey: 'userId' });
Project.belongsToMany(User, { through: TeamMembership, as: 'users', foreignKey: 'projectId' });

// --- New Associations ---

// Comment Associations
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Comment, { foreignKey: 'authorId' });

Comment.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasMany(Comment, { foreignKey: 'projectId' });

Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });

// Notification Associations
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId', onDelete: 'CASCADE' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'recipientId' });

Notification.belongsTo(Comment, { foreignKey: 'commentId', onDelete: 'CASCADE' });
Comment.hasOne(Notification, { foreignKey: 'commentId' });

// We can export all models from here
export { User, Project, Branch, Commit, TeamMembership, Comment, Notification };
