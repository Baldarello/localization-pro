# TnT - Backend

This folder contains the Node.js backend for the TnT application. It uses Express.js for the API server, Sequelize as the ORM with a self-contained SQLite database, and Passport.js for session-based authentication with Google OAuth.

## Setup & Database Management

### Initial Setup

1.  **Install Dependencies:**
    From the `backend/` directory, run:
    ```sh
    npm install
    ```

2.  **Create and Seed the Database:**
    To set up the database for the first time, run the following command from the **root** project directory:
    ```sh
    npm run setup:backend
    ```
    This single command will:
    - Install all backend dependencies (`npm install`).
    - Run all database migrations to create the tables (`db:migrate`).
    - Populate the database with initial sample data (`db:seed:all`).

    You only need to run this command once. After the initial setup, the server will handle running pending migrations automatically on startup.

### Managing the Database

All database commands should be run from within the `backend/` directory.

#### Resetting the Database
To completely wipe all data and reset the database to its initial, seeded state, run:
```sh
# From the backend/ directory
npm run db:reset
```
**Warning:** This will destroy all data in your database. This is useful for development when you want a clean slate.

#### Managing Migrations
This project uses `sequelize-cli` to manage database schema changes.

-   **Creating a New Migration**: When you change a Sequelize model (e.g., add a column), you **must** create a new migration file to reflect the change.
    ```sh
    npm run db:migration:generate -- --name your-migration-name
    ```
    This creates a new `.js` file in `src/database/migrations/`. You then need to manually edit this file to use ES Module syntax (`import`/`export`). See `guidelines.md` for a detailed example.

-   **Manually Running Migrations**: The `npm start` and `npm run dev` scripts (run from the `backend/` directory) automatically apply pending migrations on startup. You can also run them manually:
    ```sh
    npm run db:migrate
    ```

-   **Reverting a Migration**: To undo the most recent migration:
    ```sh
    npm run db:migrate:undo
    ```

-   **Reverting All Migrations**: To undo all migrations that have been applied:
    ```sh
    npm run db:migrate:undo:all
    ```

## Configuration

The backend requires an environment file to store configuration and sensitive credentials.

1.  **Create an environment file:**
    Inside the `backend/` directory, create a new file named `.env`.

2.  **Edit the `.env` file:**
    Open `backend/.env` and add the variables you need from the list below.

### Environment Variables

#### General & Server
| Variable                | Description                                                                                             | Example                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `NODE_ENV`              | The application environment. Set to `production` for production database settings.                   | `production`                          |
| `PORT`                  | The port on which the backend server will run.                                                          | `3001`                                |
| `FRONTEND_URL`          | The base URL of the frontend application. Used for OAuth redirects.                                     | `http://localhost:5173`               |
| `SESSION_SECRET`        | **Required.** A long, random string used to sign the session ID cookie.                                 | `a-very-long-and-secret-string`       |
| `ENFORCE_USAGE_LIMITS`  | Set to `true` to enable usage limits (e.g., 3 projects, 1000 terms). Primarily for cloud/demo deployments. | `true`                                |

#### Database Configuration

While the development environment uses a simple SQLite file by default, you can connect to a PostgreSQL or MySQL database for production.

1.  **Install the Database Driver:**
    First, install the necessary driver for your database. Run this command from the `backend/` directory:

    ```sh
    # For PostgreSQL
    npm install pg pg-hstore

    # For MySQL or MariaDB
    npm install mysql2
    ```

2.  **Set Environment Variables:**
    Update your `backend/.env` file with the correct credentials. The `DB_DIALECT` variable tells Sequelize which database to connect to.

| Variable                | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `DB_DIALECT`            | The dialect of the database (`postgres`, `mysql`, `sqlite`). **Required for production.**                   |
| `DB_HOST`               | The database host.                                                                                      |
| `DB_PORT`               | The database port (e.g., `5432` for PostgreSQL, `3306` for MySQL).                                                                                      |
| `DB_NAME`               | The name of the database.                                                                               |
| `DB_USER`               | The username for the database.                                                                          |
| `DB_PASS`               | The password for the database.                                                                          |
| `DB_STORAGE`            | The file path for the SQLite database (only if `DB_DIALECT=sqlite`).                                         |
| `DB_LOGGING`            | Set to `true` to enable Sequelize query logging.                                                        |
| `DB_SSL`                | Set to `true` to enable SSL for the database connection (for Postgres/MySQL).                           |

#### Google OAuth
| Variable                | Description                                                                                             | Example                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `GOOGLE_CLIENT_ID`      | **Optional.** Your Google API project's client ID. If omitted, Google Sign-In will be disabled.          | `your-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`  | **Optional.** Your Google API project's client secret. If omitted, Google Sign-In will be disabled.      | `GOCSPX-your-client-secret`           |
> **Where to get Google Credentials:**
> 1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
> 2. Create a new project.
> 3. Go to "APIs & Services" > "Credentials".
> 4. Click "Create Credentials" > "OAuth client ID".
> 5. Choose "Web application".
> 6. Under "Authorized redirect URIs", add `http://localhost:3001/api/v1/auth/google/callback`.
> 7. Click "Create". Your Client ID and Client Secret will be displayed.

#### Email (SMTP)
| Variable                | Description                                                                                             | Example                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `EMAIL_ENABLED`         | Set to `true` to enable all email-sending features.                                                     | `true`                                |
| `EMAIL_HOST`            | The hostname of your SMTP server.                                                                       | `smtp.mailgun.org`                    |
| `EMAIL_PORT`            | The port for your SMTP server (e.g., 587 for TLS, 465 for SSL).                                         | `587`                                 |
| `EMAIL_SECURE`          | Set to `true` if your SMTP server uses SSL (typically on port 465).                                       | `true`                                |
| `EMAIL_USER`            | The username for authenticating with your SMTP server.                                                  | `postmaster@sandbox.mailgun.org`      |
| `EMAIL_PASS`            | The password for authenticating with your SMTP server.                                                  | `your-smtp-password`                  |
| `EMAIL_FROM`            | The "From" address that will appear on emails sent by the application.                                  | `"MyApp" <noreply@myapp.com>`         |

## Running the Server

### For Development
To start the backend server with **nodemon** (which automatically restarts on file changes), run the following command from the **root** project directory:
```sh
npm run dev:backend
```
This script will first run any pending database migrations and then start the server.

### For Production
To start the backend server for production, first ensure your `.env` file is configured with your production database credentials. Then run:
```sh
npm run start:prod
```
This will set `NODE_ENV=production`, run any pending database migrations against your production database, and then start the server.

The server will start on `http://localhost:3001` by default.

## Running Frontend and Backend Together

To develop the full application, you need to run both the Vite frontend server and this Node.js backend server simultaneously.

1.  **In your first terminal window (from the project root), start the backend:**
    ```sh
    npm run dev:backend
    ```

2.  **In a second terminal window (from the project root), start the frontend:**
    ```sh
    npm run dev
    ```