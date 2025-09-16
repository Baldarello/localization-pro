// This script is for initializing the database with seed data.
// Run with `npm run db:seed` from the backend directory.
import sequelize from './Sequelize.js';
import { User, Project, Branch, Commit, TeamMembership } from './models/index.js';
import { AVAILABLE_LANGUAGES } from '../constants.js'; // Adjust path as needed
import logger from '../helpers/logger.js';

// --- MOCK DATA from original ApiClient ---
const USERS_DATA = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A' },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B' },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C' },
    { id: 'user-4', name: 'Diana', email: 'diana@example.com', avatarInitials: 'D' },
];

const mainBranchTermsProj1 = [
    { id: 'term-2', text: 'button_submit', context: 'A generic submit button used in forms across the application.', translations: { 'en': 'Submit', 'it': 'Invia', 'es': 'Enviar' } },
    { id: 'term-3-main', text: 'footer_copyright', translations: { 'en': '© 2024 Localization Manager Pro. All rights reserved.', 'it': '© 2024 Localization Manager Pro. Tutti i diritti riservati.', 'es': '© 2024 Localization Manager Pro. Todos los derechos reservados.' } },
    { id: 'term-4-removed', text: 'promo_banner_old', translations: { 'en': 'Old promotion text', 'it': 'Vecchio testo promozionale', 'es': 'Texto de promoción antiguo' } },
];

const featureBranchTermsProj1 = [
    { id: 'term-1', text: 'welcome_message', context: 'The first message a new user sees on the home page.', translations: { 'en': 'Welcome to our incredible application! We are happy to have you here.', 'it': 'Benvenuto nella nostra incredibile applicazione! Siamo felici di averti qui.', 'es': '¡Bienvenido a nostra increíble aplicación! Estamos felices de tenerte aquí.' } },
    { id: 'term-2', text: 'button_submit', context: 'A generic submit button used in forms across the application.', translations: { 'en': 'Send Request', 'it': 'Invia Richiesta', 'es': 'Enviar Solicitud' } },
    { id: 'term-3-main', text: 'footer_copyright', translations: { 'en': '© 2024 Localization Manager Pro. All rights reserved.', 'it': '© 2024 Localization Manager Pro. Tutti i diritti riservati.', 'es': '© 2024 Localization Manager Pro. Todos los derechos reservados.' } },
];

const mainBranchTermsProj2 = [
    { id: 'term-3', text: 'start_game', translations: { 'en': 'Start Game', 'de': 'Spiel starten' } },
];

export const seedDatabase = async () => {
    logger.info('Starting database seeding...');
    try {
        // Use { force: true } to drop tables if they exist. Be careful in production!
        await sequelize.sync({ force: true });
        logger.info('Database synchronized. Seeding data...');

        // Create Users
        await User.bulkCreate(USERS_DATA);
        logger.info('Users seeded.');

        // --- Project 1: Sample Web App ---
        const proj1 = await Project.create({
            id: 'proj-1',
            name: 'Sample Web App',
            defaultLanguageCode: 'en',
            languages: [AVAILABLE_LANGUAGES[0], AVAILABLE_LANGUAGES[1], AVAILABLE_LANGUAGES[2]],
            currentBranchName: 'main',
        });

        const mainBranch1 = await Branch.create({ name: 'main', projectId: proj1.id, workingTerms: mainBranchTermsProj1 });
        await Commit.create({
            id: 'commit-main-1',
            message: 'Initial commit',
            authorId: 'user-1',
            timestamp: new Date(Date.now() - 86400000 * 2),
            terms: mainBranchTermsProj1,
            branchId: mainBranch1.id,
        });

        const featureBranch1 = await Branch.create({ name: 'feature/new-homepage', projectId: proj1.id, workingTerms: featureBranchTermsProj1 });
        await Commit.create({
            id: 'commit-feature-1',
            message: 'feat: Add new homepage content and update submit button',
            authorId: 'user-2',
            timestamp: new Date(Date.now() - 86400000),
            terms: featureBranchTermsProj1,
            branchId: featureBranch1.id,
        });
        
        await TeamMembership.bulkCreate([
            { projectId: proj1.id, userId: 'user-1', role: 'admin', languages: ['en', 'it', 'es'] },
            { projectId: proj1.id, userId: 'user-2', role: 'editor', languages: ['it'] },
            { projectId: proj1.id, userId: 'user-3', role: 'translator', languages: ['es'] },
        ]);
        logger.info('Project 1 seeded.');

        // --- Project 2: Mobile Game ---
        const proj2 = await Project.create({
            id: 'proj-2',
            name: 'Mobile Game',
            defaultLanguageCode: 'en',
            languages: [AVAILABLE_LANGUAGES[0], AVAILABLE_LANGUAGES[3]],
            currentBranchName: 'main',
        });
        
        const mainBranch2 = await Branch.create({ name: 'main', projectId: proj2.id, workingTerms: mainBranchTermsProj2 });
        await Commit.create({
            id: 'commit-game-1',
            message: 'Initial commit for game project',
            authorId: 'user-1',
            timestamp: new Date(Date.now() - 86400000 * 5),
            terms: mainBranchTermsProj2,
            branchId: mainBranch2.id,
        });
        
        await TeamMembership.create({ projectId: proj2.id, userId: 'user-1', role: 'admin', languages: ['en', 'de'] });
        logger.info('Project 2 seeded.');

        logger.info('Database seeding completed successfully.');

    } catch (error) {
        logger.error('Failed to seed database:', error);
    }
};

// This allows running the script directly from the command line
if (process.argv[1].endsWith('seed.js')) {
    seedDatabase().then(() => {
        logger.info('Closing DB connection.');
        sequelize.close();
    });
}