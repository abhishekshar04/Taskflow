# TaskFlow

TaskFlow is a comprehensive, full-stack Task Management and Team Collaboration platform built with the MERN stack (MongoDB, Express, React, Node.js). It offers a robust set of features to help teams organize, track, and manage their tasks efficiently with real-time updates and seamless drag-and-drop capabilities.

## 🚀 Features

- **Project & Task Management**: Create projects, add tasks, and track their progress through a Kanban-style board.
- **Real-Time Collaboration**: Live updates across clients via WebSockets (Socket.IO) for task changes, new comments, and notifications.
- **Interactive Kanban Board**: Intuitive drag-and-drop interface powered by `@hello-pangea/dnd` for smooth task transitions between stages.
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control (RBAC).
- **Dashboard & Analytics**: Activity logs, completion trends, and team statistics.
- **Global Search**: Search functionality for tasks, projects, and users.
- **Responsive UI**: Modern, dynamic design tailored for usability and aesthetics.
- **Monorepo Architecture**: Clean separation of concerns with integrated scripts for both frontend and backend development.

## 🛠️ Technology Stack

**Frontend (`packages/client`)**
- React 18
- Vite
- Zustand (State Management)
- React Router DOM
- `@hello-pangea/dnd` (Drag and Drop)
- Socket.IO Client
- Axios

**Backend (`packages/server`)**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.IO (WebSockets)
- JSON Web Token (JWT) & bcryptjs
- Helmet & Morgan (Security and Logging)
- Express Validator

## 📁 Project Structure

The project is structured as an npm monorepo (using Workspaces):

```text
taskFlow/
├── packages/
│   ├── client/         # React Frontend
│   │   ├── src/        # Components, Pages, Stores, etc.
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/         # Node.js/Express Backend
│       ├── src/        # Routes, Controllers, Models, etc.
│       └── package.json
└── package.json        # Root package.json with workspace configurations
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- npm

### Installation

1. **Clone the repository** (if not already done).
2. **Install dependencies**:
   Run the following command at the root level to install dependencies for both the server and the client:
   ```bash
   npm run install:all
   ```

### Environment Variables

You need to set up your environment variables. 

1. Create a `.env` file in the `packages/server` directory.
2. Add the following necessary configurations:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173
   ```
*(Add any other required environment variables for your deployment setup, such as Railway settings.)*

### Running the Application

You can easily run both the frontend and backend simultaneously using the `concurrently` script defined in the root `package.json`.

**To start development mode (Frontend + Backend):**
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:5000`

**Individual Scripts:**
- Start server only: `npm run dev:server`
- Start client only: `npm run dev:client`
- Build client: `npm run build`

## 🚀 Deployment

The project is configured to be deployed easily. Ensure your deployment platform (e.g., Railway, Render, Vercel) is configured to handle the monorepo structure.

**Important Deployment Notes:**
- Set `PORT` and `0.0.0.0` host bindings appropriately for Railway or similar hosting providers.
- Make sure to run `npm run build` for the client workspace and correctly serve the `dist` directory or host it via a CDN/Static service.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.
