import express from 'express';
import cors from 'cors';
import path from 'path';
import documentRoutes from './modules/documents/document.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { API_PREFIX } from './config/constants.js';
import { env } from './config/env.js';

const app = express();

// Configure CORS
const allowedOrigins = env.CORS_ORIGIN === '*' 
  ? '*' 
  : env.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for uploaded files
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    storage: 'PostgreSQL + Local Disk',
  });
});

// API Routes
app.use(`${API_PREFIX}/documents`, documentRoutes);

// Global 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
