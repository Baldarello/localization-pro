# Localization Manager Pro - Backend

This folder contains the Node.js backend for the Localization Manager Pro application. It uses Express.js for the API server and Sequelize as the ORM with a self-contained SQLite database.

## Setup

1.  **Navigate to the backend directory:**
    ```sh
    cd backend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Initialize and Seed the Database:**
    To create the `database.sqlite` file and populate it with initial data, run the following command from the **root** project directory:
    ```sh
    npm run seed:backend
    ```
    You only need to run this command once during the initial setup.

## Configuration

The backend requires an environment file to store sensitive configuration like email credentials.

1.  **Create an environment file:**
    Inside the `backend/` directory, create a copy of `.env.example` and name it `.env`.
    ```sh
    cp .env.example .env
    ```

2.  **Edit the `.env` file:**
    Open `backend/.env` and fill in the values for your environment.

### Environment Variables

The following table lists all the environment variables used by the backend:

| Variable        | Description                                                                                             | Example                           |
| --------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `PORT`          | The port on which the backend server will run.                                                          | `3001`                            |
| `EMAIL_ENABLED` | Set to `true` to enable all email-sending features. If `false`, no emails will be sent.                 | `true`                            |
| `EMAIL_HOST`    | The hostname of your SMTP server.                                                                       | `smtp.mailgun.org`                |
| `EMAIL_PORT`    | The port for your SMTP server (e.g., 587 for TLS, 465 for SSL).                                         | `587`                             |
| `EMAIL_SECURE`  | Set to `true` if your SMTP server uses SSL (typically on port 465).                                       | `true`                            |
| `EMAIL_USER`    | The username for authenticating with your SMTP server.                                                  | `postmaster@sandbox.mailgun.org`  |
| `EMAIL_PASS`    | The password for authenticating with your SMTP server.                                                  | `your-smtp-password`              |
| `EMAIL_FROM`    | The "From" address that will appear on emails sent by the application.                                  | `"MyApp" <noreply@myapp.com>`     |

## Running the Server

### For Development
To start the backend server with **nodemon** (which automatically restarts on file changes), run the following command from the **root** project directory:
```sh
npm run dev:backend
```

### For Production/Standard Start
To start the backend server normally, use this command from the **root** directory:
```sh
npm run start:backend
```

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