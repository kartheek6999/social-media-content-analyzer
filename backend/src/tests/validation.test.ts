import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { UnifiedExtractionService } from '../modules/extraction/extraction.service.js';
import { DeterministicAnalysisProvider } from '../modules/analysis/analysis.service.js';

describe('Validation & Edge Case Hardening', () => {
  it('should reject unsupported file types gracefully in extraction service', async () => {
    await expect(
      UnifiedExtractionService.processFile('test.exe', 'application/x-msdownload')
    ).rejects.toThrow('Unsupported file format');
  });

  it('should handle completely empty extracted text in analysis provider cleanly', async () => {
    const provider = new DeterministicAnalysisProvider();
    const result = await provider.analyze('   ');

    expect(result.contentType).toBe('Empty Content');
    expect(result.engagementScore).toBe(10);
    expect(result.summary).toContain('No extractable text');
  });
});
