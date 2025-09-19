import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../helpers/logger.js';
import config from './config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

if (!envConfig) {
  logger.error(`Database configuration not found for environment: ${env}`);
  process.exit(1);
}

// Deep copy to avoid modifying the original config object
const sequelizeConfig = JSON.parse(JSON.stringify(envConfig));

// For SQLite, resolve the storage path relative to the project's backend root.
// The path in config.js is relative to the backend root.
// The __dirname here is src/database, so we go up two levels.
if (sequelizeConfig.dialect === 'sqlite') {
  sequelizeConfig.storage = path.join(__dirname, '..', '..', sequelizeConfig.storage);
}

const sequelize = new Sequelize(sequelizeConfig);

export default sequelize;
