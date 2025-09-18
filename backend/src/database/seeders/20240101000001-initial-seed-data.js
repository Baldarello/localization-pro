'use strict';

const bcrypt = require('bcrypt');
const { AVAILABLE_LANGUAGES } = require('../../constants.js');

const USERS_DATA_RAW = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C', password: 'password', settings: { commitNotifications: false, mentionNotifications: false } },
    { id: 'user-4', name: 'Diana (Translator)', email: 'diana@example.com', avatarInitials: 'D', password: 'password', settings: { commitNotifications: true, mentionNotifications: true } },
];

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

const now = new Date();

// Helper to hash passwords
const hashPasswords = async (users) => {
  const salt = await bcrypt.genSalt(10);
  return Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return { ...user, password: hashedPassword };
    })
  );
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedUsers = await hashPasswords(USERS_DATA_RAW);
    const usersToSeed = hashedUsers.map(({ settings, ...user }) => ({
      ...user,
      settings: JSON.stringify(settings),
      createdAt: now,
      updatedAt: now,
    }));
    await queryInterface.bulkInsert('Users', usersToSeed, {});

    const projectsToSeed = [
        {
            id: 'proj-ecommerce',
            name: 'E-Commerce Platform',
            defaultLanguageCode: 'en',
            languages: JSON.stringify(AVAILABLE_LANGUAGES.filter(l => ['en', 'de', 'fr', 'es', 'ja'].includes(l.code))),
            currentBranchName: 'main',
            createdAt: now, updatedAt: now
        },
        {
            id: 'proj-phoenix',
            name: 'Project Phoenix',
            defaultLanguageCode: 'en',
            languages: JSON.stringify(AVAILABLE_LANGUAGES.filter(l => ['en', 'pt', 'ru'].includes(l.code))),
            currentBranchName: 'main',
            createdAt: now, updatedAt: now
        }
    ];
    await queryInterface.bulkInsert('Projects', projectsToSeed, {});

    const branchesToSeed = [
        { id: 1, name: 'main', projectId: 'proj-ecommerce', workingTerms: JSON.stringify(eCommerceMainTermsCommit2), createdAt: now, updatedAt: now },
        { id: 2, name: 'feature/new-checkout-flow', projectId: 'proj-ecommerce', workingTerms: JSON.stringify(eCommerceCheckoutBranchTerms), createdAt: now, updatedAt: now },
        { id: 3, name: 'fix/translation-updates-fr', projectId: 'proj-ecommerce', workingTerms: JSON.stringify(eCommerceFrenchFixBranchTerms), createdAt: now, updatedAt: now },
        { id: 4, name: 'main', projectId: 'proj-phoenix', workingTerms: JSON.stringify(phoenixProjectMainTerms), createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('Branches', branchesToSeed, {});

    const commitsToSeed = [
        { id: 'commit-main-1-ecom', message: 'Initial commit: Add basic product and checkout terms', authorId: 'user-1', timestamp: new Date(Date.now() - 86400000 * 3), terms: JSON.stringify(eCommerceMainTermsCommit1), branchId: 1, createdAt: now, updatedAt: now },
        { id: 'commit-main-2-ecom', message: 'feat: Add user profile and footer terms', authorId: 'user-1', timestamp: new Date(Date.now() - 86400000 * 2), terms: JSON.stringify(eCommerceMainTermsCommit2), branchId: 1, createdAt: now, updatedAt: now },
        { id: 'commit-feature-1-ecom', message: 'feat: Implement new checkout flow UI terms', authorId: 'user-2', timestamp: new Date(Date.now() - 86400000), terms: JSON.stringify(eCommerceCheckoutBranchTerms), branchId: 2, createdAt: now, updatedAt: now },
        { id: 'commit-fix-1-ecom', message: 'fix: Corrected french translation for add_to_cart', authorId: 'user-3', timestamp: new Date(Date.now() - 3600000), terms: JSON.stringify(eCommerceFrenchFixBranchTerms), branchId: 3, createdAt: now, updatedAt: now },
        { id: 'commit-phoenix-1', message: 'Initial commit for Phoenix project', authorId: 'user-1', timestamp: new Date(Date.now() - 86400000 * 5), terms: JSON.stringify(phoenixProjectMainTerms), branchId: 4, createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('Commits', commitsToSeed, {});
    
    const teamMembershipsToSeed = [
        { projectId: 'proj-ecommerce', userId: 'user-1', role: 'admin', languages: JSON.stringify(['en', 'de', 'fr', 'es', 'ja']), createdAt: now, updatedAt: now },
        { projectId: 'proj-ecommerce', userId: 'user-2', role: 'editor', languages: JSON.stringify(['en', 'de']), createdAt: now, updatedAt: now },
        { projectId: 'proj-ecommerce', userId: 'user-3', role: 'translator', languages: JSON.stringify(['fr', 'es']), createdAt: now, updatedAt: now },
        { projectId: 'proj-ecommerce', userId: 'user-4', role: 'translator', languages: JSON.stringify(['ja']), createdAt: now, updatedAt: now },
        { projectId: 'proj-phoenix', userId: 'user-1', role: 'admin', languages: JSON.stringify(['en', 'pt', 'ru']), createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('TeamMemberships', teamMembershipsToSeed, {});

    const commentsToSeed = [
        { id: 'comment-1', content: 'Are we sure about this translation for German? @bob@example.com, can you double check?', termId: 'ecom-1', branchName: 'main', authorId: 'user-1', projectId: 'proj-ecommerce', parentId: null, createdAt: new Date(Date.now() - 86400000), updatedAt: now },
        { id: 'comment-2', content: 'Looks good to me, Alice!', termId: 'ecom-1', branchName: 'main', authorId: 'user-2', projectId: 'proj-ecommerce', parentId: 'comment-1', createdAt: now, updatedAt: now },
    ];
    await queryInterface.bulkInsert('Comments', commentsToSeed, {});

    const notificationsToSeed = [
        { id: 'notif-1', read: false, type: 'mention', recipientId: 'user-2', commentId: 'comment-1', createdAt: new Date(Date.now() - 86400000), updatedAt: now },
    ];
    await queryInterface.bulkInsert('Notifications', notificationsToSeed, {});
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order of insertion
    await queryInterface.bulkDelete('Notifications', null, {});
    await queryInterface.bulkDelete('Comments', null, {});
    await queryInterface.bulkDelete('TeamMemberships', null, {});
    await queryInterface.bulkDelete('Commits', null, {});
    await queryInterface.bulkDelete('Branches', null, {});
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
