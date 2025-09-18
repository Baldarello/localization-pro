// This file is used by sequelize-cli.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', '..', 'database.sqlite'),
    logging: false,
  },
  // You can add configurations for test and production environments here
  // test: { ... },
  // production: { ... }
};
