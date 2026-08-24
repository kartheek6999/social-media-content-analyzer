import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { OCRExtractionService } from '../modules/extraction/ocr.service.js';

describe('OCRExtractionService', () => {
  const assetsDir = path.join(process.cwd(), 'src/tests/assets');

  it('should handle OCR gracefully and return structured result', async () => {
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // 1x1 white PNG pixel image buffer
    const minimalPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    const testImgPath = path.join(assetsDir, 'white_pixel.png');
    fs.writeFileSync(testImgPath, minimalPngBuffer);

    const result = await OCRExtractionService.extractText(testImgPath, 15000);

    expect(result).toBeDefined();
    expect(typeof result.text).toBe('string');
    // White pixel should flag low confidence or empty text
    expect(result.isLowConfidenceOrEmpty).toBe(true);
  });

  it('should throw an AppError when image file is missing', async () => {
    await expect(OCRExtractionService.extractText('missing_image.png')).rejects.toThrow('Image file not found');
  });
});
