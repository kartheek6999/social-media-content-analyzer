import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service.js';

const documentService = new DocumentService();

export class DocumentController {
  public static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a PDF or image file.',
        });
      }

      const result = await documentService.uploadAndProcessDocument(file);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded and analyzed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAllDocuments(_req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await documentService.getAllDocuments();
      return res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const document = await documentService.getDocumentById(id);
      return res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await documentService.deleteDocument(id);
      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await documentService.getStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
