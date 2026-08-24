import { describe, it, expect } from 'vitest';
import { DeterministicAnalysisProvider } from '../modules/analysis/analysis.service.js';

describe('DeterministicAnalysisProvider', () => {
  const provider = new DeterministicAnalysisProvider();

  it('should analyze social media post and return expected JSON structure', async () => {
    const postText = `Are you struggling to scale your SaaS revenue in 2026?

Here are 3 simple shifts that doubled our MRR in 90 days:
• Stop building unrequested features
• Focus on user activation before acquisition
• Optimize your pricing page structure

Which of these are you trying first? Comment below and share with your team! #SaaS #Growth`;

    const result = await provider.analyze(postText);

    expect(result.engagementScore).toBeGreaterThan(60);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.hookSuggestion).toBeDefined();
    expect(result.ctaSuggestion).toBeDefined();
    expect(result.hashtags).toContain('#ContentStrategy');
    expect(result.readability.score).toBeGreaterThan(0);
  });

  it('should handle empty text gracefully', async () => {
    const result = await provider.analyze('');
    expect(result.contentType).toBe('Empty Content');
    expect(result.engagementScore).toBe(10);
  });
});
