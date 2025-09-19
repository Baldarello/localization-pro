import 'dotenv/config';

const productionConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT || 'sqlite',
  storage: process.env.DB_STORAGE || 'database.sqlite',
  logging: process.env.DB_LOGGING === 'true',
};

// Add SSL options only for non-sqlite dialects
if (productionConfig.dialect !== 'sqlite' && process.env.DB_SSL === 'true') {
  productionConfig.dialectOptions = {
    ssl: {
      require: true,
      // This might be needed for some cloud providers
      rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false', 
    },
  };
}

const config = {
  development: {
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: productionConfig,
};

export default config;
