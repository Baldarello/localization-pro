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
  tags: [
    { name: 'Authentication' },
    { name: 'Users' },
    { name: 'Projects' },
    { name: 'Terms' },
    { name: 'Translations' },
    { name: 'Team' },
    { name: 'Branches' },
    { name: 'Commits', description: 'Operations related to commit history' }
  ],
  components: {
    schemas: {
        AddMemberResult: {
            type: "object",
            properties: {
                user: { "$ref": "#/components/schemas/User" },
                success: { type: "boolean" },
                message: { type: "string" },
                code: { type: "string", enum: ["user_exists", "user_not_found", "project_not_found"] }
            }
        },
        ApiKey: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                permissions: { "$ref": "#/components/schemas/ApiKeyPermissions" },
                keyPrefix: { type: "string", description: "A public, non-secret prefix for the key." },
                secret: { type: "string", description: "The secret part of the key. ONLY returned on creation." },
                createdAt: { type: "string", format: "date-time" },
                lastUsedAt: { type: "string", format: "date-time", nullable: true }
            }
        },
        ApiKeyPermissions: {
            type: "string",
            enum: ["readonly", "edit", "admin"]
        },
        Branch: {
            type: "object",
            properties: {
                name: { type: "string" },
                commits: { type: "array", items: { "$ref": "#/components/schemas/Commit" } },
                workingTerms: { type: "array", items: { "$ref": "#/components/schemas/Term" } }
            }
        },
        Comment: {
            type: "object",
            properties: {
                id: { type: "string" },
                content: { type: "string" },
                termId: { type: "string" },
                branchName: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                author: { "$ref": "#/components/schemas/CommentAuthor" },
                parentId: { type: "string", nullable: true },
                replies: {
                    type: "array",
                    items: {
                        // Recursive reference
                        "$ref": "#/components/schemas/Comment"
                    }
                }
            }
        },
        CommentAuthor: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                avatarInitials: { type: "string" }
            }
        },
        Commit: {
            type: "object",
            properties: {
                id: { type: "string" },
                message: { type: "string" },
                authorId: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
                terms: { type: "array", items: { "$ref": "#/components/schemas/Term" } }
            }
        },
        Invitation: {
            type: "object",
            properties: {
                id: { type: "integer" },
                email: { type: "string", format: "email" },
                role: { "$ref": "#/components/schemas/UserRole" },
                languages: { type: "array", items: { type: "string" } },
                createdAt: { type: "string", format: "date-time" }
            }
        },
        Language: {
            type: "object",
            properties: {
                code: { type: "string", example: "en" },
                name: { type: "string", example: "English" }
            }
        },
        LastEditResponse: {
            type: "object",
            properties: {
                id: { type: "string", description: "A synthetic ID for the translation record, in the format {termId}-{langCode}.", example: "d3a7341d-8e44-4fab-9d10-150e6065f067-it" },
                value: { type: "string", description: "The translated value." },
                localeId: { type: "string", description: "The language code for the locale.", example: "it" },
                termId: { type: "string", description: "The ID of the term this translation belongs to." },
                createdAt: { type: "string", format: "date-time", description: "The timestamp of the commit where this translation was created or last updated." },
                updatedAt: { type: "string", format: "date-time", description: "The timestamp of the commit where this translation was created or last updated." }
            }
        },
        LocaleDetails: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                localeId: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                language: { type: "string" },
                code: { type: "string" },
                region: { type: "string", nullable: true }
            }
        },
        Notification: {
            type: "object",
            properties: {
                id: { type: "string" },
                read: { type: "boolean" },
                type: { type: "string", enum: ["mention"] },
                createdAt: { type: "string", format: "date-time" },
                comment: { "$ref": "#/components/schemas/Comment" },
                termId: { type: "string" },
                projectId: { type: "string" },
                branchName: { type: "string" }
            }
        },
        Project: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                defaultLanguageCode: { type: "string" },
                languages: { type: "array", items: { "$ref": "#/components/schemas/Language" } },
                branches: { type: "array", items: { "$ref": "#/components/schemas/Branch" } },
                currentBranchName: { type: "string" },
                team: {
                    type: "object",
                    description: "Maps user ID to role and assigned languages.",
                    additionalProperties: {
                        type: "object",
                        properties: {
                            role: { "$ref": "#/components/schemas/UserRole" },
                            languages: { type: "array", items: { type: "string" } }
                        }
                    }
                },
                apiKeys: {
                    type: "array",
                    items: { "$ref": "#/components/schemas/ApiKey" }
                },
                pendingInvitations: {
                    type: "array",
                    items: { "$ref": "#/components/schemas/Invitation" }
                }
            }
        },
        Term: {
            type: "object",
            properties: {
                id: { type: "string" },
                text: { type: "string", description: "The term key." },
                context: { type: "string", description: "Context for translators." },
                translations: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    example: { en: "Submit", es: "Enviar" }
                }
            }
        },
        User: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string", format: "email" },
                avatarInitials: { type: "string" }
            }
        },
        UserRole: {
            type: "string",
            enum: ["translator", "editor", "admin"]
        }
    },
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