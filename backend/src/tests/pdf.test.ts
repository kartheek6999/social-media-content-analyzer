import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { PDFExtractionService } from '../modules/extraction/pdf.service.js';

describe('PDFExtractionService', () => {
  const samplePdfPath = path.join(process.cwd(), 'src/tests/assets/pdfjs_test.pdf');

  it('should parse PDF document text retaining layout', async () => {
    expect(fs.existsSync(samplePdfPath)).toBe(true);

    const result = await PDFExtractionService.extractText(samplePdfPath);

    expect(result.text).toContain('Social Media Strategy 2026');
    expect(result.pageCount).toBe(1);
    expect(result.isScannedOrEmpty).toBe(false);
  });

  it('should throw an AppError when PDF file does not exist', async () => {
    await expect(PDFExtractionService.extractText('non_existent.pdf')).rejects.toThrow('PDF file not found');
  });
});
