const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TnT API',
    version: '1.0.0',
    description: 'TnT (Terms and Translations) API for managing localization projects, terms, translations, and teams.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: "Session cookie for browser-based authentication."
      },
      apiKeyPrefix: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Api-Key-Prefix',
        description: "The public prefix of your API key (`tnt_key_...`). Must be used with the Authorization header."
      },
      apiSecret: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API-SECRET',
        description: "The secret part of your API key (`tnt_sec_...`). Must be used with the X-Api-Key-Prefix header."
      }
    },
  },
  security: [
    { cookieAuth: [] },
    {
      apiKeyPrefix: [],
      apiSecret: []
    }
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js'],
};

export default options;
