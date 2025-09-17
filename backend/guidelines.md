# Project Maintenance Guide

## API Documentation
### Accessing API Documentation
Once the server is running, you can access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### Updating API Documentation
To regenerate the API documentation after making changes to the endpoints:

## Environment Setup

### Prerequisites
Before running the application, you need to set up your environment variables.

### Environment Variables Configuration

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in the `.env` file:**

#### Database Configuration
The application supports multiple database types. Configure based on your chosen database:

**For SQLite (Default):**
```env
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
DB_LOGGING=false
```

**For PostgreSQL:**
```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
DB_LOGGING=false
```

**For MySQL/MariaDB:**
```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
DB_LOGGING=false
```

### Note on Automated Changes
The AI assistant maintaining this project is configured to **not** modify or create any files starting with a dot (`.`), such as `.env` or `.env.example`. All required environment variables are documented in the `README.md` files. Please refer to `README.md` and `backend/README.md` for setting up your `.env` files.

#### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
**Important:** Use a strong, unique secret key for production environments.

#### Email Configuration
```env
EMAIL_NAME=your-email-name
EMAIL_HOST=your-smtp-host
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@example.com
```

#### Server Configuration (Optional)
```env
PORT=3000
NODE_ENV=development
```

### Handling Missing Environment Variables

The application should be robust against missing environment variables. The general principle is:

-   **Required for Core Functionality (Production):** If a variable is essential for security or core functionality in a production environment (e.g., `SESSION_SECRET`), the application **must** refuse to start and log a fatal error.
-   **Required for Core Functionality (Development):** In a development environment, it is acceptable to use a hardcoded, insecure default value for essential variables to facilitate easier setup. A clear and prominent warning must be logged to the console in this case.
-   **Optional/Feature-Specific:** If a variable enables an optional feature (e.g., `GOOGLE_CLIENT_ID` for Google OAuth), its absence should not crash the server. Instead, the application should gracefully disable the corresponding feature and log a warning that the feature is disabled.

### Required Environment Variables
The following environment variables are **required** and must be set:

- **Database:** `DB_DIALECT` and corresponding database connection variables
- **JWT:** `JWT_SECRET`
- **Email:** `EMAIL_NAME`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

### Database Setup
After configuring your environment variables:

1. **Install database dependencies** (if using PostgreSQL/MySQL):
   ```bash
   # For PostgreSQL
   npm install pg pg-hstore

   # For MySQL/MariaDB
   npm install mysql2
   ```

2. **Start the application** - it will automatically create the database tables on first run.

## Project Structure

```
abilora-bk/
├── app.js                      # Main application configuration
├── package.json                # Project dependencies and scripts
├── database.sqlite             # SQLite database file
├── bin/
│   └── www.js                     # Server startup script
├── src/                        # Source Code Directory
│   ├── routes/                 # API Routes Directory
│   │   ├── index.js           # Home page routes
│   │   └── users.js           # User-related API endpoints
│   ├── database/              # Database Layer
│   │   ├── Sequelize.js       # Database configuration
│   │   ├── model/             # Database Models Directory
│   │   │   └── User.js        # User model definition
│   │   └── dao/               # Data Access Objects Directory
│   │       └── UserDao.js     # User data access methods
│   └── helpers/               # Utility Functions Directory
│       ├── logger.js          # Winston-based logging system
│       ├── mailer.js          # Email sending functionality
│       ├── utility.js         # Common utility functions
│       ├── NetworkUtils.js    # Network-related utilities
│       ├── systemPath.js      # System path utilities
│       └── TotallyNotAnError.js # Custom error handling
├── test/
│   └── users.http             # API testing requests
├── public/                    # Static files
└── views/                     # View templates
```

## Core Directories Explanation

### 📁 Models Directory: `src/database/model/`
**Location**: `src/database/model/`

**Purpose**: Contains all database model definitions using Sequelize ORM.

**What it contains**:
- Database table schemas
- Model relationships and associations
- Data validation rules
- Model-specific methods

**Current Models**:
- `User.js` - User model with fields: id, email, password, name, salt, active, verificationCode

**How to add a new model**:
1. Create a new file in `src/database/model/` (e.g., `Product.js`)
2. Define the model using Sequelize syntax
3. Export the model for use in DAOs

**Example Model Structure**:
```javascript
const {DataTypes, Model } = require('sequelize');
const sequelize = require("../Sequelize");

class YourModel extends Model {}

YourModel.init({
    // Define your fields here
}, {
    sequelize,
    modelName: 'YourModel',
});

module.exports = YourModel;
```

### 📁 DAO Directory: `src/database/dao/`
**Location**: `src/database/dao/`

**Purpose**: Contains Data Access Objects that handle all database queries and operations on models.

**What it contains**:
- CRUD operations (Create, Read, Update, Delete)
- Complex database queries
- Business logic related to data access
- Error handling for database operations

**Current DAOs**:
- `UserDao.js` - Contains methods like `existEmail()` and `createUser()`

**How to add a new DAO**:
1. Create a new file in `src/database/dao/` (e.g., `ProductDao.js`)
2. Import the corresponding model
3. Implement database operation methods
4. Export the methods for use in routes

**Example DAO Structure**:
```javascript
const YourModel = require("../model/YourModel");

const createItem = async (data) => {
    try {
        return await YourModel.create(data);
    } catch (error) {
        console.error("Unable to create item:", error);
        throw error;
    }
}

const findById = async (id) => {
    try {
        return await YourModel.findByPk(id);
    } catch (error) {
        console.error("Unable to find item:", error);
        throw error;
    }
}

module.exports = { createItem, findById };
```

### 📁 Routes Directory: `src/routes/`
**Location**: `src/routes/`

**Purpose**: Contains all API endpoint definitions and HTTP request handlers.

**What it contains**:
- RESTful API endpoints
- Request validation
- Response formatting
- Integration with DAO methods
- Error handling for API requests

**Current Routes**:
- `index.js` - Home page routes
- `users.js` - User management endpoints:
  - `POST /users` - Create a new user
  - `GET /users/email/:email` - Get user by email

**How to add a new route file**:
1. Create a new file in `src/routes/` (e.g., `products.js`)
2. Define your API endpoints using Express router
3. Import and use corresponding DAO methods
4. Register the route in `app.js`

**Example Route Structure**:
```javascript
var express = require('express');
var router = express.Router();
const { createItem, findById } = require('../database/dao/YourDao');

router.post('/', async function(req, res, next) {
    try {
        const item = await createItem(req.body);
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.get('/:id', async function(req, res, next) {
    try {
        const item = await findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve item' });
    }
});

module.exports = router;
```

### 📁 Helpers Directory: `src/helpers/`
**Location**: `src/helpers/`

**Purpose**: Contains utility functions and helper modules that provide common functionality across the application.

**What it contains**:
- Logging utilities
- Email functionality
- Common utility functions
- Network utilities
- Error handling
- System path utilities

**Current Helper Files**:
- `logger.js` - Winston-based logging system with file rotation and console output
- `mailer.js` - Email sending functionality using nodemailer
- `utility.js` - Common utility functions (UUID generation, date differences, IP extraction, validation handling)
- `NetworkUtils.js` - Network-related utility functions
- `systemPath.js` - System path management utilities
- `TotallyNotAnError.js` - Custom error handling class

**How to add a new helper**:
1. Create a new file in `src/helpers/` (e.g., `validation.js`)
2. Implement your utility functions
3. Export the functions for use in other modules
4. Import and use in routes, DAOs, or other helpers as needed

**Example Helper Structure**:
```javascript
const logger = require('./logger');

const yourUtilityFunction = (param) => {
    try {
        // Your utility logic here
        return result;
    } catch (error) {
        logger.error('Error in utility function:', error);
        throw error;
    }
}

module.exports = { yourUtilityFunction };
```

## Database Configuration

**Location**: `src/database/Sequelize.js`

This file contains the Sequelize configuration for SQLite database connection. The database file is stored as `database.sqlite` in the project root.

## How to Maintain the Project

### Adding New Features

1. **Create a Model** (if needed):
   - Add new model file in `src/database/model/`
   - Define the database schema using Sequelize

2. **Create a DAO**:
   - Add new DAO file in `src/database/dao/`
   - Implement database operations for the model

3. **Create Routes**:
   - Add new route file in `src/routes/`
   - Define API endpoints that use DAO methods
   - Register the route in `app.js`

4. **Add Helper Functions** (if needed):
   - Add new helper file in `src/helpers/`
   - Implement utility functions for common operations
   - Use helpers in routes, DAOs, or other modules

5. **Test the API**:
   - Add test requests in `test/` directory
   - Use `.http` files for manual testing

### Best Practices

1. **Separation of Concerns**:
   - Models: Only database schema and relationships
   - DAOs: Only database operations and queries
   - Routes: Only HTTP request/response handling
   - Helpers: Only utility functions and common operations

2. **Error Handling**:
   - Always wrap database operations in try-catch blocks
   - Provide meaningful error messages
   - Use appropriate HTTP status codes

3. **Naming Conventions**:
   - Models: PascalCase (e.g., `User.js`, `Product.js`)
   - DAOs: PascalCase with "Dao" suffix (e.g., `UserDao.js`)
   - Routes: lowercase (e.g., `users.js`, `products.js`)
   - Helpers: camelCase (e.g., `logger.js`, `mailer.js`, `utility.js`)

4. **File Organization**:
   - Keep related functionality together
   - Follow the established directory structure
   - One model per file, one DAO per model
   - Group utility functions logically in helpers
   - Use descriptive names for helper functions

## Running the Project

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start on the port defined in `bin/www.js` (default: 3000).

## API Testing

Use the `.http` files in the `test/` directory to test API endpoints. Current test file:
- `test/users.http` - Contains tests for user-related endpoints

## Dependencies

- **Express.js**: Web framework
- **Sequelize**: ORM for database operations
- **SQLite3**: Database engine
- **Morgan**: HTTP request logger
- **Cookie-parser**: Cookie parsing middleware
- **Winston**: Advanced logging library with file rotation
- **Nodemailer**: Email sending functionality
- **Express-validator**: Request validation middleware
