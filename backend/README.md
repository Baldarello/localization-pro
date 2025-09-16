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
