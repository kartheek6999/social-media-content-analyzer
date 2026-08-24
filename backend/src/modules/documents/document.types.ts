import { ProcessingStatus } from '@prisma/client';
import { AnalysisOutput } from '../analysis/analysis.service.js';

export interface DocumentResponse {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: ProcessingStatus;
  extractedText: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  analysis?: AnalysisOutput | null;
}
