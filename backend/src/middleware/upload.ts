import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from '../config/constants.js';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';

// Ensure upload directory exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Prevent path traversal by extracting basename only and removing invalid characters
    const sanitizedBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedBase).toLowerCase();
    const nameWithoutExt = path.basename(sanitizedBase, ext);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Invalid file type (${ext || file.mimetype}). Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400
      )
    );
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});
