import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { DocumentService } from '../modules/documents/document.service.js';
import { createTestPdfFile } from './helpers.js';

describe('DocumentService Integration', () => {
  const documentService = new DocumentService();
  let samplePdfPath: string;

  beforeAll(async () => {
    samplePdfPath = await createTestPdfFile('api_test_sample.pdf');
  });

  it('should process a valid uploaded PDF document end-to-end', async () => {
    const pdfBuf = fs.readFileSync(samplePdfPath);

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test_social_post.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: pdfBuf.length,
      destination: path.dirname(samplePdfPath),
      filename: 'api_test_sample.pdf',
      path: samplePdfPath,
      buffer: pdfBuf,
      stream: null as any,
    };

    const doc = await documentService.uploadAndProcessDocument(mockFile);

    expect(doc.id).toBeDefined();
    expect(doc.originalFilename).toBe('test_social_post.pdf');
    expect(doc.status).toBe('COMPLETED');
    expect(doc.extractedText).toContain('Social Media Strategy');
    expect(doc.analysis).toBeDefined();
    expect(doc.analysis?.engagementScore).toBeGreaterThan(0);
    expect(doc.analysis?.hookSuggestion).toBeDefined();
  });

  it('should retrieve document list and document statistics', async () => {
    const docs = await documentService.getAllDocuments();
    expect(Array.isArray(docs)).toBe(true);

    const stats = await documentService.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
  });

  it('should delete document by ID successfully', async () => {
    const docs = await documentService.getAllDocuments();
    if (docs.length > 0) {
      const targetId = docs[0].id;
      await documentService.deleteDocument(targetId);

      const updatedDocs = await documentService.getAllDocuments();
      expect(updatedDocs.some(d => d.id === targetId)).toBe(false);
    }
  });
});
