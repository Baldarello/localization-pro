# Localization Manager Pro

An elegant and efficient web application for managing project localizations. Inspired by the workflow of POEditor, it allows users to easily add projects, define translation keys, and provide translations for multiple languages.

This application features role-based access control, branching for parallel development, commit history, and AI-powered translation suggestions using the Gemini API.

## ✨ Features

-   **Project Dashboard**: View and manage all your localization projects in one place.
-   **Role-Based Access Control**: Assign Admin, Editor, or Translator roles to team members.
-   **Term & Translation Management**: A clean interface for adding terms, context, and translations.
-   **Git-like Branching**: Create feature branches to work on translations in isolation without affecting the main version.
-   **Compare & Merge**: Visually compare branches and merge changes back into the main branch.
-   **Commit History**: Track every change with a detailed commit log and a diff viewer.
-   **AI-Powered Translations**: Get instant translation suggestions using Google's Gemini API.
-   **Email Notifications**: Receive email updates for events like new commits, with user-configurable settings.
-   **Data Import/Export**: Easily move data in and out using JSON or CSV formats.
-   **Team Management**: Invite and manage users for each project with language-specific permissions.
-   **Customizable Theming**: Personalize the UI with different color themes and dark/light modes.
-   **Interactive API Documentation**: Explore and test the backend API with a built-in Swagger UI.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, MobX, Material-UI (MUI), Vite
-   **Backend**: Node.js, Express.js, Sequelize ORM (with SQLite), Nodemailer
-   **AI**: Google Gemini API

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later is recommended)
-   npm (comes bundled with Node.js)
-   A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/localization-manager-pro.git
    cd localization-manager-pro
    ```

2.  **Install root dependencies:**
    (This includes Vite and other frontend development tools)
    ```sh
    npm install
    ```

3.  **Install backend dependencies:**
    ```sh
    cd backend
    npm install
    cd ..
    ```

### Configuration

This project requires two environment files: one for the frontend and one for the backend.

#### 1. Frontend (`.env` in the root directory)

Create a file named `.env` in the project's **root** directory.

```env
# .env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

| Variable         | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| `GEMINI_API_KEY` | **Required.** Your API key for Google Gemini, used for AI translation features. |

> **Important**: The AI translation feature will not work without a valid Gemini API key.

#### 2. Backend (`.env` in the `backend/` directory)

Navigate to the `backend/` directory, copy the example file, and then edit the new `.env` file with your specific configuration.

```sh
cd backend
cp .env.example .env
```

The `.env.example` file outlines the required variables:

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


### Initialize and Seed the Database

The backend uses a self-contained SQLite database. To create the database file and populate it with sample projects and users, run the following command from the **root** project directory:
```sh
npm run seed:backend
```
This command only needs to be run once during the initial setup. It will create a `database.sqlite` file inside the `backend/` directory.

### Running the Application

To run the full application, you need to start both the frontend and backend servers simultaneously in two separate terminals.

1.  **Terminal 1: Start the Backend Server**
    From the project root directory, run:
    ```sh
    npm run dev:backend
    ```
    This will start the Node.js server on `http://localhost:3001` with `nodemon`, which automatically restarts when you make changes to backend files. You can access the interactive API documentation at `http://localhost:3001/api-docs`.

2.  **Terminal 2: Start the Frontend Server**
    From the project root directory, run:
    ```sh
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`. Open this URL in your browser to use the application.

---

## 🏗️ Project Structure

The project is organized into a monorepo-like structure with a clear separation between the frontend and backend code.

```
/
├── backend/              # Node.js, Express, Sequelize backend source
│   ├── src/
│   │   ├── database/     # Sequelize models, DAOs, and seed script
│   │   ├── helpers/      # Utility modules (logger, mailer)
│   │   ├── middleware/   # Express middleware
│   │   └── routes/       # API route definitions
│   ├── .env.example      # Backend environment variables template
│   ├── app.js            # Express application setup
│   └── package.json      # Backend dependencies
├── public/               # Static assets for the frontend
├── src/                  # Frontend source code (React + TypeScript)
│   ├── components/       # Reusable React components
│   ├── stores/           # MobX state management stores
│   ├── App.tsx           # Main application component
│   └── index.tsx         # Frontend entry point
├── .env                  # Frontend environment variables (you create this file)
├── index.html            # Main HTML file for the frontend
├── openapi.json          # OpenAPI specification for the API
└── package.json          # Root project scripts & dependencies
```
For a more detailed breakdown of the backend structure, see the [backend README](./backend/README.md).

---

## 📦 Building for Production

To create a production-ready build of the frontend, run the following command from the project root:

```sh
npm run build
```

This will compile the TypeScript and React code and bundle it into a `dist/` directory. The contents of this directory can then be served by any static file server or integrated into a backend framework.

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.