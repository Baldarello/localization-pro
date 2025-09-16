import User from './User.js';
import Project from './Project.js';
import Branch from './Branch.js';
import Commit from './Commit.js';
import TeamMembership from './TeamMembership.js';

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

// We can export all models from here
export { User, Project, Branch, Commit, TeamMembership };
