import bcrypt from 'bcrypt';
import { UserRole, AVAILABLE_LANGUAGES } from '../../constants.js';

const saltRounds = 10;

// Helper to hash passwords
const hashPassword = (password) => bcrypt.hash(password, saltRounds);

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const users = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', password: await hashPassword('password'), avatarInitials: 'A' },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', password: await hashPassword('password'), avatarInitials: 'B' },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', password: await hashPassword('password'), avatarInitials: 'C' },
    { id: 'user-4', name: 'Diana (Translator)', email: 'diana@example.com', password: await hashPassword('password'), avatarInitials: 'D' },
  ];
  await queryInterface.bulkInsert('Users', users, {});

  const projects = [
    {
      id: 'proj-1',
      name: 'E-commerce Website',
      defaultLanguageCode: 'en',
      languages: JSON.stringify(AVAILABLE_LANGUAGES.slice(0, 4)), // en, it, es, de
      currentBranchName: 'main',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'proj-2',
      name: 'Mobile Game',
      defaultLanguageCode: 'en',
      languages: JSON.stringify(AVAILABLE_LANGUAGES.filter(l => ['en', 'ja', 'zh'].includes(l.code))),
      currentBranchName: 'main',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
  await queryInterface.bulkInsert('Projects', projects, {});

  const teamMemberships = [
    // Project 1
    { projectId: 'proj-1', userId: 'user-1', role: UserRole.Admin, languages: JSON.stringify(['en', 'it', 'es', 'de']) },
    { projectId: 'proj-1', userId: 'user-2', role: UserRole.Editor, languages: JSON.stringify(['en', 'it']) },
    { projectId: 'proj-1', userId: 'user-3', role: UserRole.Translator, languages: JSON.stringify(['es']) },
    { projectId: 'proj-1', userId: 'user-4', role: UserRole.Translator, languages: JSON.stringify(['de']) },
    // Project 2
    { projectId: 'proj-2', userId: 'user-1', role: UserRole.Admin, languages: JSON.stringify(['en', 'ja', 'zh']) },
    { projectId: 'proj-2', userId: 'user-2', role: UserRole.Editor, languages: JSON.stringify(['en']) },
    { projectId: 'proj-2', userId: 'user-4', role: UserRole.Translator, languages: JSON.stringify(['ja', 'zh']) },
  ];
  await queryInterface.bulkInsert('TeamMemberships', teamMemberships, {});

  const branches = [
    { id: 1, name: 'main', projectId: 'proj-1', workingTerms: '[]' },
    { id: 2, name: 'feature/new-checkout', projectId: 'proj-1', workingTerms: '[]' },
    { id: 3, name: 'main', projectId: 'proj-2', workingTerms: '[]' },
  ];
  await queryInterface.bulkInsert('Branches', branches, {});

  const proj1Terms = [
    { id: 'term-1', text: 'welcome_message', translations: { en: 'Welcome!', es: '¡Bienvenido!', de: 'Willkommen!' } },
    { id: 'term-2', text: 'submit_button', translations: { en: 'Submit' } },
    { id: 'term-3', text: 'error.not_found', context: "Page not found error", translations: { en: 'The page you were looking for could not be found.' } },
  ];
  const proj2Terms = [
    { id: 'term-4', text: 'play_now', translations: { en: 'Play Now!', ja: '今すぐプレイ！' } },
    { id: 'term-5', text: 'settings.title', translations: { en: 'Settings', ja: '設定' } },
  ];

  const commits = [
    { id: 'commit-1', message: 'Initial commit', authorId: 'user-1', timestamp: new Date(), terms: JSON.stringify(proj1Terms), branchId: 1 },
    { id: 'commit-2', message: 'Initial commit for mobile game', authorId: 'user-1', timestamp: new Date(), terms: JSON.stringify(proj2Terms), branchId: 3 },
  ];
  await queryInterface.bulkInsert('Commits', commits, {});

  // Update working terms on branches to match latest commit
  const mainBranchProj1 = await queryInterface.sequelize.query(`SELECT * FROM Branches WHERE id = 1`, { type: queryInterface.sequelize.QueryTypes.SELECT });
  if (mainBranchProj1.length > 0) {
    await queryInterface.bulkUpdate('Branches', { workingTerms: JSON.stringify(proj1Terms) }, { id: 1 });
  }
  const mainBranchProj2 = await queryInterface.sequelize.query(`SELECT * FROM Branches WHERE id = 3`, { type: queryInterface.sequelize.QueryTypes.SELECT });
  if (mainBranchProj2.length > 0) {
    await queryInterface.bulkUpdate('Branches', { workingTerms: JSON.stringify(proj2Terms) }, { id: 3 });
  }

  // Set up the feature branch to be identical to main for proj-1
  const featureBranch = await queryInterface.sequelize.query(`SELECT * FROM Branches WHERE id = 2`, { type: queryInterface.sequelize.QueryTypes.SELECT });
  if (featureBranch.length > 0) {
    await queryInterface.bulkInsert('Commits', [{ id: 'commit-3', message: 'Branch for new checkout', authorId: 'user-2', timestamp: new Date(), terms: JSON.stringify(proj1Terms), branchId: 2 }], {});
    await queryInterface.bulkUpdate('Branches', { workingTerms: JSON.stringify(proj1Terms) }, { id: 2 });
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Commits', null, {});
  await queryInterface.bulkDelete('Branches', null, {});
  await queryInterface.bulkDelete('TeamMemberships', null, {});
  await queryInterface.bulkDelete('Projects', null, {});
  await queryInterface.bulkDelete('Users', null, {});
}
