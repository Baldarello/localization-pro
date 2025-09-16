const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Localization Manager Pro API',
    version: '1.0.0',
    description: 'API for managing localization projects, terms, translations, and teams.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-User-ID',
        description: "User's ID for authentication. For testing, you can use 'user-1' (Admin), 'user-2' (Editor), or 'user-3' (Translator)."
      },
    },
  },
  security: [
    {
      apiKeyAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js'],
};

export default options;
