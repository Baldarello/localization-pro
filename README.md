# TnT (Terms and Translations)

An elegant and efficient web application for managing project localizations, with a focus on terms and translations. Inspired by the workflow of POEditor, it allows users to easily add projects, define translation keys, and provide translations for multiple languages.

This application features role-based access control, branching for parallel development, commit history, and AI-powered translation suggestions using the Gemini API.

## ✨ Features

-   **Project Dashboard**: View and manage all your localization projects in one place.
-   **Secure Authentication**: Supports both traditional email/password login and Google OAuth 2.0.
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
-   **Backend**: Node.js, Express.js, Sequelize ORM (with SQLite), Passport.js, Nodemailer
-   **AI**: Google Gemini API

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later is recommended)
-   npm (comes bundled with Node.js)
-   A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   **Google OAuth 2.0 Credentials**. See the backend configuration section for details.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/tnt.git
    cd tnt
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
REACT_APP_IS_PROD=false
```

| Variable            | Description                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`    | **Required.** Your API key for Google Gemini, used for AI translation features.                           |
| `REACT_APP_IS_PROD` | **Optional.** Set to `true` to make the frontend API client point to the production backend URL. Defaults to `false`. |

#### 2. Backend (`.env` in the `backend/` directory)

Navigate to the `backend/` directory and create a new file named `.env`. Fill it with the variables below.

| Variable                | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`                  | The port on which the backend server will run (e.g., `3001`).                                           |
| `FRONTEND_URL`          | The base URL of the frontend app, for OAuth redirects (e.g., `http://localhost:5173`).                  |
| `SESSION_SECRET`        | **Required.** A long, random string for securing session cookies.                                       |
| `GOOGLE_CLIENT_ID`      | **Optional.** Your Google OAuth 2.0 Client ID. If omitted, Google Sign-In will be disabled.            |
| `GOOGLE_CLIENT_SECRET`  | **Optional.** Your Google OAuth 2.0 Client Secret. If omitted, Google Sign-In will be disabled.         |
| `EMAIL_ENABLED`         | Set to `true` to enable email features.                                                                 |
| ..._email variables_    | SMTP server credentials for sending emails (optional).                                                  |

> **Where to get Google OAuth Credentials:**
> 1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
> 2. Create a new project.
> 3. Go to "APIs & Services" > "Credentials".
> 4. Click "Create Credentials" > "OAuth client ID".
> 5. Choose "Web application".
> 6. Under "Authorized redirect URIs", add `http://localhost:3001/api/v1/auth/google/callback`.
> 7. Click "Create". Your Client ID and Client Secret will be displayed.

### Initialize and Seed the Database

The backend uses a self-contained SQLite database. To create the database file, apply the schema, and populate it with sample data, run the following command from the **root** project directory:
```sh
npm run setup:backend
```
This command only needs to be run once during the initial setup. It will install backend dependencies, run all migrations, and seed the database, creating a `database.sqlite` file inside the `backend/` directory.

### Running the Application

To run the full application, you need to start both the frontend and backend servers simultaneously in two separate terminals.

1.  **Terminal 1: Start the Backend Server**
    From the project root directory, run:
    ```sh
    npm run dev:backend
    ```
    This will start the Node.js server on `http://localhost:3001` with `nodemon`. You can access the interactive API documentation at `http://localhost:3001/api-docs`.

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
│   │   ├── config/       # Passport.js strategy configuration
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