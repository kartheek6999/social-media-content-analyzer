import { Router } from 'express';
import { DocumentController } from './document.controller.js';
import { uploadMiddleware } from '../../middleware/upload.js';

const router = Router();

// POST /api/v1/documents/upload
router.post(
  '/upload',
  uploadMiddleware.single('file'),
  DocumentController.uploadDocument
);

// GET /api/v1/documents
router.get('/', DocumentController.getAllDocuments);

// GET /api/v1/documents/stats
router.get('/stats', DocumentController.getStats);

// GET /api/v1/documents/:id
router.get('/:id', DocumentController.getDocumentById);

// DELETE /api/v1/documents/:id
router.delete('/:id', DocumentController.deleteDocument);

export default router;
