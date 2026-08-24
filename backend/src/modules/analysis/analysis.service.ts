import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

export interface AnalysisOutput {
  contentType: string;
  summary: string;
  engagementScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  hookSuggestion: string;
  ctaSuggestion: string;
  hashtags: string[];
  readability: {
    score: number;
    feedback: string;
  };
}

export interface IAnalysisProvider {
  analyze(text: string): Promise<AnalysisOutput>;
}

/**
 * Deterministic Rule-Based Fallback Provider
 * Evaluates real characteristics of the extracted social media text.
 */
export class DeterministicAnalysisProvider implements IAnalysisProvider {
  public async analyze(text: string): Promise<AnalysisOutput> {
    const cleanText = text.trim();
    if (!cleanText) {
      return {
        contentType: 'Empty Content',
        summary: 'No extractable text was found in the provided document.',
        engagementScore: 10,
        strengths: ['Document file successfully uploaded.'],
        weaknesses: ['Extracted text is empty or non-selectable.'],
        suggestions: ['Upload a clearer image or a PDF with selectable text.'],
        hookSuggestion: 'Add a high-contrast opening title or headline.',
        ctaSuggestion: 'Include a clear call to action at the end.',
        hashtags: ['#SocialMedia', '#ContentStrategy'],
        readability: {
          score: 0,
          feedback: 'Text length insufficient for readability analysis.',
        },
      };
    }

    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const firstLine = sentences[0] || cleanText.slice(0, 100);

    const ctaKeywords = ['comment', 'link', 'bio', 'share', 'click', 'subscribe', 'save', 'dm', 'let me know', 'follow', 'visit', 'check out'];
    const hasCTA = ctaKeywords.some(kw => cleanText.toLowerCase().includes(kw));

    const questionHook = firstLine.includes('?') || /^(how|why|what|did you know|stop|are you|the best|5 ways)/i.test(firstLine);
    const emojiCount = (cleanText.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    const hasBulletPoints = /[\u2022\*\-\d+\.]\s+/.test(cleanText);

    // Calculate Engagement Score dynamically
    let score = 50;
    if (questionHook) score += 15;
    if (hasCTA) score += 15;
    if (emojiCount >= 2 && emojiCount <= 8) score += 10;
    if (hasBulletPoints) score += 10;
    if (words.length >= 30 && words.length <= 250) score += 10;
    if (words.length > 400) score -= 10; // penalty for overly verbose post
    if (!hasCTA) score -= 15;

    score = Math.max(15, Math.min(98, score));

    // Determine Content Type
    let contentType = 'General Post';
    if (cleanText.toLowerCase().includes('carousel') || paragraphs.length >= 4) {
      contentType = 'Carousel / Multi-Slide Post';
    } else if (words.length < 40) {
      contentType = 'Short Status / Quote';
    } else if (words.length > 250) {
      contentType = 'Long-form Article / Newsletter';
    } else if (cleanText.toLowerCase().includes('reel') || cleanText.toLowerCase().includes('video')) {
      contentType = 'Short Video Script';
    }

    // Build Strengths
    const strengths: string[] = [];
    if (questionHook) strengths.push('Strong hook present in opening line');
    if (hasCTA) strengths.push('Clear call to action included');
    if (hasBulletPoints) strengths.push('Good visual formatting with bullet points / lists');
    if (emojiCount > 0) strengths.push(`Uses emojis (${emojiCount}) to break up visual text block`);
    if (paragraphs.length > 1) strengths.push(`Well-spaced with ${paragraphs.length} clear paragraph breaks`);
    if (strengths.length === 0) strengths.push('Contains readable topic messaging');

    // Build Weaknesses
    const weaknesses: string[] = [];
    if (!questionHook) weaknesses.push('Opening line lacks a high-impact hook or curiosity gap');
    if (!hasCTA) weaknesses.push('Missing explicit call-to-action to drive comments or shares');
    if (words.length > 300) weaknesses.push('Text is quite long for standard social media feeds');
    if (paragraphs.length === 1 && words.length > 50) weaknesses.push('Dense wall of text without paragraph breaks');
    if (emojiCount === 0) weaknesses.push('Lacks visual breaks or emoji highlights');

    // Build Suggestions
    const suggestions: string[] = [];
    if (!questionHook) suggestions.push('Rewrite the opening sentence into a provocative question or strong stat.');
    if (!hasCTA) suggestions.push('Add a clear request at the end: "Save this for later" or "Drop your thoughts below!"');
    if (paragraphs.length === 1) suggestions.push('Break lines into 1-2 sentence paragraphs for mobile scannability.');
    suggestions.push('Keep line lengths concise to maintain high visual reader retention.');

    // Build Hook Suggestion
    const hookSuggestion = questionHook
      ? `Current hook is decent. Try intensifying it: "${firstLine.trim().replace(/\.$/, '')} — Here is what you need to know."`
      : `Replace opening with: "Are you struggling with ${words.slice(0, 5).join(' ')}? Here is the exact breakdown:"`;

    // Build CTA Suggestion
    const ctaSuggestion = hasCTA
      ? 'Enhance current CTA: "Drop a comment below with your take, and share this with a colleague who needs it!"'
      : 'Add this CTA to the end: "Found this helpful? Save this post and comment your favorite tip below! 👇"';

    // Build Hashtags
    const hashtags = [
      '#ContentStrategy',
      '#SocialMediaMarketing',
      '#EngagementTips',
      '#DigitalMarketing',
      '#GrowthHacking'
    ];

    // Readability
    const avgWordsPerSentence = Math.round(words.length / (sentences.length || 1));
    let readabilityScore = 80;
    let readabilityFeedback = 'Easy to read and scanner-friendly.';

    if (avgWordsPerSentence > 22) {
      readabilityScore = 55;
      readabilityFeedback = 'Sentences are on average long and complex. Shorten sentence structure.';
    } else if (avgWordsPerSentence < 8) {
      readabilityScore = 90;
      readabilityFeedback = 'Pithy and highly punchy sentence structure!';
    }

    // Summary
    const summary = cleanText.length > 200 
      ? cleanText.slice(0, 197) + '...' 
      : cleanText;

    return {
      contentType,
      summary,
      engagementScore: score,
      strengths,
      weaknesses,
      suggestions,
      hookSuggestion,
      ctaSuggestion,
      hashtags,
      readability: {
        score: readabilityScore,
        feedback: readabilityFeedback,
      },
    };
  }
}

/**
 * Gemini API Provider
 * Uses Google Generative AI model when GEMINI_API_KEY is configured.
 */
export class GeminiAnalysisProvider implements IAnalysisProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async analyze(text: string): Promise<AnalysisOutput> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert social media strategist and viral content analyst.
Analyze the following social media post text and return a valid JSON object matching this EXACT schema:
{
  "contentType": "string (e.g. Carousel, Short Reel Script, Single Image Post, LinkedIn Article)",
  "summary": "string (2 sentence summary of content)",
  "engagementScore": number (0 to 100 based on viral potential),
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "suggestions": ["string", "string"],
  "hookSuggestion": "string (revised high-converting opening line)",
  "ctaSuggestion": "string (revised high-converting call to action)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],
  "readability": {
    "score": number (0 to 100),
    "feedback": "string (brief feedback)"
  }
}

Rules:
- Respond ONLY with raw valid JSON. No markdown code blocks, no explanation.
- Keep recommendations actionable and specific to the input text.

Input Text:
"""
${text}
"""`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Clean potential JSON markdown wrapping
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed: AnalysisOutput = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.warn('[GEMINI AI PROVIDER WARNING] Gemini API call failed. Falling back to deterministic analysis provider.', err);
      const fallback = new DeterministicAnalysisProvider();
      return fallback.analyze(text);
    }
  }
}

export class ContentAnalysisService {
  private provider: IAnalysisProvider;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      this.provider = new GeminiAnalysisProvider(env.GEMINI_API_KEY.trim());
    } else {
      this.provider = new DeterministicAnalysisProvider();
    }
  }

  public async analyzeContent(extractedText: string): Promise<AnalysisOutput> {
    return this.provider.analyze(extractedText);
  }
}
