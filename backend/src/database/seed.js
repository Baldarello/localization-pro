// This script is for initializing the database with seed data.
// Run with `npm run db:seed` from the backend directory.
import sequelize from './Sequelize.js';
import { User, Project, Branch, Commit, TeamMembership, Comment, Notification, ApiKey } from './models/index.js';
import { AVAILABLE_LANGUAGES } from '../constants.js'; // Adjust path as needed
import logger from '../helpers/logger.js';

// --- MOCK DATA ---
const USERS_DATA = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C', password: 'password', settings: { commitNotifications: false, mentionNotifications: false } },
    { id: 'user-4', name: 'Diana (Translator)', email: 'diana@example.com', avatarInitials: 'D', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
];

// --- Project 1: E-Commerce Platform Data ---

// Main branch - Commit 1 (Initial)
const eCommerceMainTermsCommit1 = [
    { id: 'ecom-1', text: 'add_to_cart', context: 'Button text for adding a product to the shopping cart.', translations: { 'en': 'Add to Cart', 'de': 'In den Warenkorb', 'fr': 'Ajouter au panier', 'es': 'Añadir a la cesta', 'ja': 'カートに入れる' } },
    { id: 'ecom-2', text: 'product_description', context: 'Header for the product description section.', translations: { 'en': 'Product Description', 'de': 'Produktbeschreibung', 'fr': 'Description du produit', 'es': 'Descripción del producto', 'ja': '商品説明' } },
    { id: 'ecom-3', text: 'checkout_button', context: 'Button to proceed to the checkout page.', translations: { 'en': 'Checkout', 'de': 'Zur Kasse', 'fr': 'Passer la commande', 'es': 'Pagar', 'ja': 'チェックアウト' } },
];

// Main branch - Commit 2 (Adds user profile)
const eCommerceMainTermsCommit2 = [
    ...eCommerceMainTermsCommit1,
    { id: 'ecom-4', text: 'user_profile_greeting', context: 'Greeting message in the user\'s profile dropdown. Uses {name} as a placeholder.', translations: { 'en': 'Hello, {name}', 'de': 'Hallo, {name}', 'fr': 'Bonjour, {name}', 'es': 'Hola, {name}', 'ja': 'こんにちは、{name}さん' } },
    { id: 'ecom-5', text: 'footer_copyright', translations: { 'en': `© ${new Date().getFullYear()} E-Commerce Inc.`, 'de': `© ${new Date().getFullYear()} E-Commerce Inc.`, 'fr': `© ${new Date().getFullYear()} E-Commerce Inc.`, 'es': `© ${new Date().getFullYear()} E-Commerce Inc.`, 'ja': `© ${new Date().getFullYear()} E-Commerce Inc.` } },
];

// Feature branch for new checkout flow
const eCommerceCheckoutBranchTerms = [
    eCommerceMainTermsCommit2.find(t => t.id === 'ecom-1'), // add_to_cart
    eCommerceMainTermsCommit2.find(t => t.id === 'ecom-2'), // product_description
    { ...eCommerceMainTermsCommit2.find(t => t.id === 'ecom-3'), translations: { 'en': 'Proceed to Payment', 'de': 'Weiter zur Zahlung', 'fr': 'Continuer vers le paiement', 'es': 'Proceder al pago', 'ja': 'お支払いに進む' } }, // modified checkout_button
    eCommerceMainTermsCommit2.find(t => t.id === 'ecom-4'), // user_profile_greeting
    eCommerceMainTermsCommit2.find(t => t.id === 'ecom-5'), // footer_copyright
    { id: 'ecom-6', text: 'shipping_options', context: 'Label for shipping options selection.', translations: { 'en': 'Shipping Options', 'de': 'Versandoptionen', 'fr': 'Options de livraison', 'es': 'Opciones de envío', 'ja': '配送オプション' } },
    { id: 'ecom-7', text: 'payment_method', context: 'Label for payment method selection.', translations: { 'en': 'Payment Method', 'de': 'Zahlungsmethode', 'fr': 'Moyen de paiement', 'es': 'Método de pago', 'ja': 'お支払い方法' } },
].filter(Boolean);

// Fix branch for French translations
const eCommerceFrenchFixBranchTerms = [
    { ...eCommerceMainTermsCommit2.find(t => t.id === 'ecom-1'), translations: { ...eCommerceMainTermsCommit2.find(t => t.id === 'ecom-1').translations, 'fr': 'Ajouter au panier' } }, // Corrected French
    ...eCommerceMainTermsCommit2.filter(t => t.id !== 'ecom-1')
];

// --- Project 2: Project Phoenix Data ---
const phoenixProjectMainTerms = [
    { id: 'phx-1', text: 'dashboard_title', translations: { 'en': 'My Dashboard', 'pt': 'Meu Painel', 'ru': 'Моя приборная панель' } },
    { id: 'phx-2', text: 'create_new_task', translations: { 'en': 'Create New Task', 'pt': 'Criar Nova Tarefa', 'ru': 'Создать новую задачу' } },
];


export const seedDatabase = async () => {
    logger.info('Starting database seeding...');
    try {
        // Use { force: true } to drop tables if they exist. Be careful in production!
        await sequelize.sync({ force: true });
        logger.info('Database synchronized. Wiping old data and seeding new data...');

        // Create Users - individualHooks: true ensures the beforeCreate hook runs for each user to hash passwords.
        await User.bulkCreate(USERS_DATA, { individualHooks: true });
        logger.info('Users seeded.');

        // --- Project 1: E-Commerce Platform ---
        const proj1 = await Project.create({
            id: 'proj-ecommerce',
            name: 'E-Commerce Platform',
            defaultLanguageCode: 'en',
            languages: [
                AVAILABLE_LANGUAGES.find(l => l.code === 'en'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'de'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'fr'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'es'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'ja'),
            ].filter(Boolean),
            currentBranchName: 'main',
        });

        // Main branch for Project 1
        const mainBranch1 = await Branch.create({ name: 'main', projectId: proj1.id, workingTerms: eCommerceMainTermsCommit2 });
        await Commit.create({
            id: 'commit-main-1-ecom',
            message: 'Initial commit: Add basic product and checkout terms',
            authorId: 'user-1',
            timestamp: new Date(Date.now() - 86400000 * 3),
            terms: eCommerceMainTermsCommit1,
            branchId: mainBranch1.id,
        });
        await Commit.create({
            id: 'commit-main-2-ecom',
            message: 'feat: Add user profile and footer terms',
            authorId: 'user-1',
            timestamp: new Date(Date.now() - 86400000 * 2),
            terms: eCommerceMainTermsCommit2,
            branchId: mainBranch1.id,
        });

        // Feature branch for Project 1
        const featureBranch1 = await Branch.create({ name: 'feature/new-checkout-flow', projectId: proj1.id, workingTerms: eCommerceCheckoutBranchTerms });
        await Commit.create({
            id: 'commit-feature-1-ecom',
            message: 'feat: Implement new checkout flow UI terms',
            authorId: 'user-2',
            timestamp: new Date(Date.now() - 86400000),
            terms: eCommerceCheckoutBranchTerms,
            branchId: featureBranch1.id,
        });
        
        // Fix branch for Project 1
        const fixBranch1 = await Branch.create({ name: 'fix/translation-updates-fr', projectId: proj1.id, workingTerms: eCommerceFrenchFixBranchTerms });
        await Commit.create({
            id: 'commit-fix-1-ecom',
            message: 'fix: Corrected french translation for add_to_cart',
            authorId: 'user-3',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            terms: eCommerceFrenchFixBranchTerms,
            branchId: fixBranch1.id,
        });

        await TeamMembership.bulkCreate([
            { projectId: proj1.id, userId: 'user-1', role: 'admin', languages: ['en', 'de', 'fr', 'es', 'ja'] },
            { projectId: proj1.id, userId: 'user-2', role: 'editor', languages: ['en', 'de'] },
            { projectId: proj1.id, userId: 'user-3', role: 'translator', languages: ['fr', 'es'] },
            { projectId: proj1.id, userId: 'user-4', role: 'translator', languages: ['ja'] },
        ]);
        logger.info('Project 1 (E-Commerce Platform) seeded.');

        // --- Project 2: Project Phoenix ---
        const proj2 = await Project.create({
            id: 'proj-phoenix',
            name: 'Project Phoenix',
            defaultLanguageCode: 'en',
            languages: [
                AVAILABLE_LANGUAGES.find(l => l.code === 'en'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'pt'),
                AVAILABLE_LANGUAGES.find(l => l.code === 'ru'),
            ].filter(Boolean),
            currentBranchName: 'main',
        });
        
        const mainBranch2 = await Branch.create({ name: 'main', projectId: proj2.id, workingTerms: phoenixProjectMainTerms });
        await Commit.create({
            id: 'commit-phoenix-1',
            message: 'Initial commit for Phoenix project',
            authorId: 'user-1',
            timestamp: new Date(Date.now() - 86400000 * 5),
            terms: phoenixProjectMainTerms,
            branchId: mainBranch2.id,
        });
        
        await TeamMembership.create({ projectId: proj2.id, userId: 'user-1', role: 'admin', languages: ['en', 'pt', 'ru'] });
        logger.info('Project 2 (Project Phoenix) seeded.');
        
        // --- Comments and Notifications ---
        const comment1 = await Comment.create({
            id: 'comment-1',
            content: 'Are we sure about this translation for German? @bob@example.com, can you double check?',
            termId: 'ecom-1',
            branchName: 'main',
            authorId: 'user-1',
            projectId: proj1.id,
            parentId: null,
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
        });

        await Comment.create({
            id: 'comment-2',
            content: 'Looks good to me, Alice!',
            termId: 'ecom-1',
            branchName: 'main',
            authorId: 'user-2',
            projectId: proj1.id,
            parentId: 'comment-1',
        });

        // A notification for Bob from comment-1
        await Notification.create({
            id: 'notif-1',
            read: false,
            type: 'mention',
            recipientId: 'user-2', // Bob
            commentId: comment1.id,
        });
        logger.info('Comments and Notifications seeded.');

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