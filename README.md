# Nexus Social — Community Discussion Platform

A Reddit-style social platform designed to bring people together through posts, threaded discussions, comments, and voting. The project explores full-stack web development, user authentication, database management, and automated code-quality checks.

## Overview

Nexus Social is a community-driven platform where users can publish content, participate in discussions, and interact with posts shared by others. It aims to provide a structured environment for online conversations with user authentication and interactive features.

The project is built using modern web technologies, with a focus on modular application architecture and maintainable code.

## Features

- **User Authentication:** JWT-based authentication for protected user actions.
- **Post Management:** Functionality for sharing and managing discussion content.
- **Nested Comments:** Threaded conversations that allow users to respond to existing comments.
- **Voting System:** Enables users to interact with posts through voting.
- **Database Integration:** MongoDB stores application content.
- **Code Quality Workflow:** GitHub Actions is configured to run automated code-quality checks.
- **Deployment Workflow:** The repository includes a workflow for deploying through Vercel.

*Feature availability may depend on the current implementation and configuration.*

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Next.js | Web application framework |
| TypeScript | Type-safe application development |
| Node.js | JavaScript runtime |
| Express.js | Backend API framework, where used |
| MongoDB | Document-oriented data storage |
| Prisma | Database access and ORM tooling |
| Supabase | Backend services and database-related infrastructure |
| Tailwind CSS | Utility-first styling |
| JWT | Authentication tokens |
| GitHub Actions | Automated workflow execution |
| Vercel | Deployment platform |

## Architecture

The application follows a frontend-and-backend approach:

1. **User Interface:** Users interact with the platform through its web interface.
2. **Request Handling:** Application routes and backend logic process user requests.
3. **Authentication:** Protected operations require appropriate authentication.
4. **Data Management:** Database access handles application records.
5. **Automated Workflows:** GitHub Actions checks the code and can coordinate subsequent build, test, and deployment steps when configured and successful.

## Project Structure

The repository contains the following major directories and files:

- `src/` — Application source code.
- `prisma/` — Database schema and related Prisma resources.
- `public/` — Static assets.
- `.github/workflows/` — GitHub Actions workflow definitions.
- `husky/` — Git hooks configuration.
- `.env.example` — Example environment variable configuration.
- `docker-compose.yml` — Docker Compose configuration.
- `Dockerfile` — Container build configuration.
- `README.md` — Project documentation.

## Getting Started

### Prerequisites

- Node.js and a compatible package manager.
- Access to the database and services configured for the project.
- Git.

### Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd nexus-social
   ```

2. Install dependencies using the package manager specified by the repository's lockfile.

3. Configure the required environment variables using `.env.example` as a reference. Add valid credentials for the services used by the application.

4. Set up the database and run any required migrations according to the project's configuration.

5. Start the application using the development script defined in `package.json`.

   ```bash
   npm run dev
   ```

The exact commands and required environment variables depend on the current project configuration.

## CI/CD and Current Development Status

The repository includes GitHub Actions workflows for code quality, building, testing, and deployment.

**Current issue:** The Code Quality workflow is failing during a push-triggered run. The subsequent build, deployment, and testing checks were skipped in the run shown in GitHub Actions.

I am investigating the failure by reviewing the workflow logs and configuration, identifying the root cause, and working towards a fix. The workflow will be rerun after changes to verify that the checks execute successfully.

## Learning Outcomes

This project provides practical exposure to:

- Full-stack application development.
- REST API and backend concepts.
- Authentication and protected operations.
- Database integration and data modelling.
- Modular project organization.
- Git, GitHub, and automated development workflows.
- Debugging and troubleshooting CI/CD issues.

## Future Improvements

- Resolve the current code-quality workflow failure.
- Verify that automated tests run reliably.
- Improve error handling and input validation.
- Strengthen authentication and access controls.
- Improve documentation and deployment reliability.

## Author

**Maitreyee Dahane**

GitHub: [MaitreyeeDahane](https://github.com/MaitreyeeDahane)

---

*This project is independently developed for learning and demonstration purposes.*

