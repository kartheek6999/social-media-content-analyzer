import { describe, it, expect } from 'vitest';
import { DeterministicAnalysisProvider } from '../modules/analysis/analysis.service.js';

describe('ContentAnalysisService Quality & Non-Contradiction Tests', () => {
  const provider = new DeterministicAnalysisProvider();

  it('1. should process Resume-like content without name-based hook or contradictions', async () => {
    const resumeText = `Desineedi Yaswanth Naga Durga Kartheek
Software Engineer | Full Stack Developer
Email: kartheek@example.com | Phone: +91 91911XXXXX | GitHub: github.com/kartheek6999

EDUCATION:
B.Tech in Computer Science & Engineering - GPA: 8.5/10

TECHNICAL SKILLS:
- Languages: TypeScript, JavaScript, Python, SQL
- Frameworks: Next.js, React, Node.js, Express, Tailwind CSS
- Databases & Tools: PostgreSQL, Prisma, Git, Docker

PROJECTS:
Social Media Content Analyzer: Built a full-stack document OCR & engagement optimization app.`;

    const result = await provider.analyze(resumeText);

    expect(result.contentType).toBe('Resume / Professional Profile');
    expect(result.hookSuggestion).not.toContain('Are you struggling with Desineedi');
    expect(result.hookSuggestion).not.toContain('Desineedi Yaswanth Naga Durga Kartheek');
    expect(result.hookSuggestion).toContain('Software Engineer');

    // Check logical non-contradiction
    const ctaInStrength = result.strengths.some(s => s.toLowerCase().includes('call to action'));
    const ctaInWeakness = result.weaknesses.some(w => w.toLowerCase().includes('call to action') || w.toLowerCase().includes('cta'));
    expect(ctaInStrength && ctaInWeakness).toBe(false);
  });

  it('2. should process content with a real CTA without contradictory weaknesses', async () => {
    const postWithCTA = `Are you tired of low engagement on your posts?

Here is the 3-step formula we use to scale reach:
1. Write a question hook
2. Keep line lengths short
3. End with a question

Drop a comment below with your favorite tip and save for later!`;

    const result = await provider.analyze(postWithCTA);

    const ctaInStrength = result.strengths.some(s => s.toLowerCase().includes('call to action'));
    const ctaInWeakness = result.weaknesses.some(w => w.toLowerCase().includes('call to action') || w.toLowerCase().includes('cta'));

    expect(ctaInStrength).toBe(true);
    expect(ctaInWeakness).toBe(false);
  });

  it('3. should process content without a CTA without contradictory strengths', async () => {
    const postWithoutCTA = `Here is a quick observation about modern software architecture.

Monoliths are often faster to build and easier to deploy than premature microservices for early stage applications.`;

    const result = await provider.analyze(postWithoutCTA);

    const ctaInStrength = result.strengths.some(s => s.toLowerCase().includes('call to action'));
    const ctaInWeakness = result.weaknesses.some(w => w.toLowerCase().includes('call to action') || w.toLowerCase().includes('cta'));

    expect(ctaInStrength).toBe(false);
    expect(ctaInWeakness).toBe(true);
  });

  it('4. should process content starting with a person name without generating a name-based hook', async () => {
    const nameLeadingText = `Kartheek Naidu
System Architect & Developer

Today I want to share 5 key principles of building production-grade web applications.`;

    const result = await provider.analyze(nameLeadingText);

    expect(result.hookSuggestion).not.toContain('Are you struggling with Kartheek');
    expect(result.hookSuggestion).not.toContain('Kartheek Naidu');
  });

  it('5. should process short generic social media post cleanly', async () => {
    const shortPost = `Shipping new features every single week is the best way to get real user feedback fast.`;

    const result = await provider.analyze(shortPost);

    expect(result.contentType).toBe('Short Status / Quote');
    expect(result.engagementScore).toBeGreaterThan(0);
    expect(result.readability.score).toBeGreaterThan(0);
  });
});
