import fs from 'fs';
import { ProcessingStatus } from '@prisma/client';
import { prisma, checkDbConnection } from '../../config/db.js';
import { UnifiedExtractionService } from '../extraction/extraction.service.js';
import { ContentAnalysisService } from '../analysis/analysis.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { DocumentResponse } from './document.types.js';
import { env } from '../../config/env.js';

// Memory store strictly for offline development/test mode if database is unconfigured
const memoryStore = new Map<string, DocumentResponse>();

export class DocumentService {
  private analysisService: ContentAnalysisService;

  constructor() {
    this.analysisService = new ContentAnalysisService();
  }

  private async getPersistenceMode(): Promise<'DB' | 'MEMORY'> {
    const isDbAlive = await checkDbConnection();
    if (isDbAlive) return 'DB';
    
    // In production, DB MUST be connected. Silent fallback to memory is disabled to prevent silent data loss.
    if (env.NODE_ENV === 'production') {
      throw new AppError('Database connection error. Unable to persist document records in production.', 500);
    }

    console.warn('[DEV PERSISTENCE] PostgreSQL offline. Using transient local memory storage for development.');
    return 'MEMORY';
  }

  public async uploadAndProcessDocument(file: Express.Multer.File): Promise<DocumentResponse> {
    if (!file) {
      throw new AppError('No file provided for upload', 400);
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mode = await this.getPersistenceMode();

    let docRecord: any = null;

    if (mode === 'DB') {
      docRecord = await prisma.document.create({
        data: {
          id: docId,
          originalFilename: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          storagePath: file.path,
          status: ProcessingStatus.PROCESSING,
        },
      });
    } else {
      docRecord = {
        id: docId,
        originalFilename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storagePath: file.path,
        status: ProcessingStatus.PROCESSING,
        extractedText: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.set(docId, docRecord);
    }

    try {
      // 1. Text Extraction (PDF or OCR)
      const extractionRes = await UnifiedExtractionService.processFile(file.path, file.mimetype);
      const extractedText = extractionRes.text;

      // 2. Content Analysis
      const analysisRes = await this.analysisService.analyzeContent(extractedText);

      // 3. Save Success State
      if (mode === 'DB') {
        await prisma.document.update({
          where: { id: docId },
          data: {
            status: ProcessingStatus.COMPLETED,
            extractedText,
          },
        });

        await prisma.analysis.create({
          data: {
            documentId: docId,
            contentType: analysisRes.contentType,
            summary: analysisRes.summary,
            engagementScore: analysisRes.engagementScore,
            strengths: analysisRes.strengths,
            weaknesses: analysisRes.weaknesses,
            suggestions: analysisRes.suggestions,
            hookSuggestion: analysisRes.hookSuggestion,
            ctaSuggestion: analysisRes.ctaSuggestion,
            hashtags: analysisRes.hashtags,
            readability: analysisRes.readability,
          },
        });

        const updatedDoc = await prisma.document.findUnique({
          where: { id: docId },
          include: { analyses: true },
        });

        return {
          id: updatedDoc!.id,
          originalFilename: updatedDoc!.originalFilename,
          fileType: updatedDoc!.fileType,
          fileSize: updatedDoc!.fileSize,
          storagePath: updatedDoc!.storagePath,
          status: updatedDoc!.status,
          extractedText: updatedDoc!.extractedText,
          errorMessage: updatedDoc!.errorMessage,
          createdAt: updatedDoc!.createdAt,
          updatedAt: updatedDoc!.updatedAt,
          analysis: analysisRes,
        };
      } else {
        const resultDoc: DocumentResponse = {
          ...docRecord,
          status: ProcessingStatus.COMPLETED,
          extractedText,
          analysis: analysisRes,
        };
        memoryStore.set(docId, resultDoc);
        return resultDoc;
      }
    } catch (error: any) {
      console.error('[DOCUMENT PROCESSING FAILED]', error);
      const errorMsg = error?.message || 'Processing failed during text extraction or analysis';

      // Clean up orphaned uploaded file if disk file exists
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (_) {}
      }

      if (mode === 'DB') {
        await prisma.document.update({
          where: { id: docId },
          data: {
            status: ProcessingStatus.FAILED,
            errorMessage: errorMsg,
          },
        });
      } else {
        const failedDoc: DocumentResponse = {
          ...docRecord,
          status: ProcessingStatus.FAILED,
          errorMessage: errorMsg,
        };
        memoryStore.set(docId, failedDoc);
      }

      throw new AppError(`Document processing error: ${errorMsg}`, 422);
    }
  }

  public async getAllDocuments(): Promise<DocumentResponse[]> {
    const mode = await this.getPersistenceMode();

    if (mode === 'DB') {
      const docs = await prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        include: { analyses: true },
      });

      return docs.map(doc => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        storagePath: doc.storagePath,
        status: doc.status,
        extractedText: doc.extractedText,
        errorMessage: doc.errorMessage,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        analysis: doc.analyses[0] ? (doc.analyses[0] as any) : null,
      }));
    } else {
      return Array.from(memoryStore.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  public async getDocumentById(id: string): Promise<DocumentResponse> {
    const mode = await this.getPersistenceMode();

    if (mode === 'DB') {
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { analyses: true },
      });

      if (!doc) {
        throw new AppError('Document not found', 404);
      }

      return {
        id: doc.id,
        originalFilename: doc.originalFilename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        storagePath: doc.storagePath,
        status: doc.status,
        extractedText: doc.extractedText,
        errorMessage: doc.errorMessage,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        analysis: doc.analyses[0] ? (doc.analyses[0] as any) : null,
      };
    } else {
      const doc = memoryStore.get(id);
      if (!doc) {
        throw new AppError('Document not found', 404);
      }
      return doc;
    }
  }

  public async deleteDocument(id: string): Promise<void> {
    const mode = await this.getPersistenceMode();

    if (mode === 'DB') {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (doc && doc.storagePath && fs.existsSync(doc.storagePath)) {
        try {
          fs.unlinkSync(doc.storagePath);
        } catch (_) {}
      }
      await prisma.document.delete({ where: { id } });
    } else {
      const doc = memoryStore.get(id);
      if (doc && doc.storagePath && fs.existsSync(doc.storagePath)) {
        try {
          fs.unlinkSync(doc.storagePath);
        } catch (_) {}
      }
      memoryStore.delete(id);
    }
  }

  public async getStats() {
    const docs = await this.getAllDocuments();
    const total = docs.length;
    const completed = docs.filter(d => d.status === ProcessingStatus.COMPLETED).length;
    const failed = docs.filter(d => d.status === ProcessingStatus.FAILED).length;
    const processing = docs.filter(d => d.status === ProcessingStatus.PROCESSING).length;

    return {
      total,
      completed,
      failed,
      processing,
    };
  }
}
