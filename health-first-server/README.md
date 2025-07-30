# Health First Server

A NestJS-based backend application for health management system.

## Description

This is a NestJS application that provides a robust backend API for health management services. It includes:

- RESTful API endpoints
- PostgreSQL database integration with TypeORM
- Environment-based configuration
- CORS enabled
- Global validation pipes
- Health check endpoints

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Environment Setup

1. Copy the environment example file:

```bash
cp env.example .env
```

2. Update the `.env` file with your database credentials:

```env
NODE_ENV=development
PORT=3000

MONGO_URI=mongodb+srv://kalyani:12345@cluster0.re9v5m0.mongodb.net/

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d
```

## Database Setup

The application is configured to use MongoDB. The connection string is set in the `.env` file. Make sure your MongoDB instance is running and accessible.

## API Endpoints

- `GET /api/` - Welcome message
- `GET /api/health` - Health check endpoint
- `GET /api/docs` - Swagger API documentation

## Project Structure

```
src/
├── controllers/     # Route controllers
├── services/        # Business logic
├── entities/        # Database entities
├── modules/         # Feature modules
├── config/          # Configuration files
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start the application in development mode with hot reload
- `npm run start:debug` - Start the application in debug mode
- `npm run start:prod` - Start the application in production mode
- `npm run test` - Run unit tests
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:cov` - Run unit tests with coverage
- `npm run test:e2e` - Run e2e tests
- `npm run lint` - Lint the code

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Programming language
- **Mongoose** - MongoDB Object Document Mapping
- **MongoDB** - Database
- **Express** - Web framework
- **Swagger** - API documentation
- **Jest** - Testing framework
