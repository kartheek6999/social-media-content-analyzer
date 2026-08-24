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

// Stop words to prevent extracting names or trivial words as topics
const COMMON_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'resume', 'curriculum',
  'vitae', 'email', 'phone', 'contact', 'mobile', 'address', 'linkedin', 'github'
]);

/**
 * Deterministic Rule-Based Analysis Provider
 * Intelligently analyzes text structure, detects resumes vs social posts, 
 * and enforces strict logical consistency between strengths and weaknesses.
 */
export class DeterministicAnalysisProvider implements IAnalysisProvider {
  public async analyze(text: string): Promise<AnalysisOutput> {
    const cleanText = text.trim();
    if (!cleanText) {
      return {
        contentType: 'Empty Content',
        summary: 'No extractable text was found in the provided document.',
        engagementScore: 10,
        strengths: ['Document file uploaded successfully.'],
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

    const sentences = cleanText.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const lowerText = cleanText.toLowerCase();

    // Detect Content Category
    const resumeMarkers = ['education', 'experience', 'projects', 'skills', 'b.tech', 'btech', 'university', 'college', 'gpa', 'curriculum vitae', 'resume', 'contact:', 'github.com', 'linkedin.com', 'b.e', 'm.tech', 'b.s', 'm.s'];
    const resumeMatches = resumeMarkers.filter(m => lowerText.includes(m));
    const isResume = resumeMatches.length >= 2;

    const isCarousel = lowerText.includes('carousel') || lowerText.includes('slide') || lowerText.includes('swipe') || paragraphs.length >= 4;
    const isScript = lowerText.includes('reel') || lowerText.includes('video') || lowerText.includes('tiktok') || lowerText.includes('audio');
    const isLaunch = lowerText.includes('introducing') || lowerText.includes('announcing') || lowerText.includes('launch') || lowerText.includes('available now');

    let contentType = 'Social Media Post';
    if (isResume) {
      contentType = 'Resume / Professional Profile';
    } else if (isCarousel) {
      contentType = 'Carousel / Multi-Slide Post';
    } else if (isScript) {
      contentType = 'Short Video / Reel Script';
    } else if (isLaunch) {
      contentType = 'Product Announcement / Marketing';
    } else if (words.length > 250) {
      contentType = 'Long-Form Article / Newsletter';
    } else if (words.length < 35) {
      contentType = 'Short Status / Quote';
    }

    // Detect Call to Action (CTA) phrases cleanly
    const ctaPhrases = [
      'comment below', 'drop a comment', 'link in bio', 'share this', 'click the link',
      'click link', 'subscribe', 'save this', 'save for later', 'dm me', 'send a dm',
      'follow for more', 'follow me', 'check out the link', 'let me know', 'visit our',
      'reach out', 'connect on linkedin', 'contact me', 'apply now', 'learn more'
    ];
    const hasCTA = ctaPhrases.some(phrase => lowerText.includes(phrase));

    // Detect Hook presence in opening sentences
    const firstLine = (sentences[0] || '').trim();
    const questionHook = firstLine.includes('?') || /^(how|why|what|did you know|stop|are you|the best|5 ways|3 steps|top 10)/i.test(firstLine);
    const emojiCount = (cleanText.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    const hasBulletPoints = /[\u2022\*\-\d+\.]\s+/.test(cleanText);

    // Calculate Engagement Score
    let score = 50;
    if (questionHook) score += 15;
    if (hasCTA) score += 15;
    if (emojiCount >= 2 && emojiCount <= 8) score += 10;
    if (hasBulletPoints) score += 10;
    if (words.length >= 30 && words.length <= 250) score += 10;
    if (isResume) score -= 15; // Resume text requires repackaging for social engagement
    if (!hasCTA) score -= 10;
    if (!questionHook) score -= 10;

    score = Math.max(15, Math.min(98, score));

    // Construct Strengths & Weaknesses (GUARANTEED LOGICAL CONSISTENCY - NO CONTRADICTIONS)
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (isResume) {
      strengths.push('Comprehensive technical skills and professional project background listed.');
      strengths.push('Structured section divisions making qualifications clear.');
      if (hasBulletPoints) strengths.push('Good use of bullet points for readability.');

      weaknesses.push('Raw resume text is too dense for direct social media feed engagement.');
      if (!questionHook) weaknesses.push('Lacks an engaging personal branding hook for social media.');
      if (!hasCTA) weaknesses.push('Missing explicit social media call to action (e.g. "Connect on LinkedIn").');
    } else {
      // Strengths for standard posts
      if (questionHook) {
        strengths.push('Strong hook present in the opening line.');
      }
      if (hasCTA) {
        strengths.push('Clear call to action included to drive reader interaction.');
      }
      if (hasBulletPoints) {
        strengths.push('Effective visual structure using bullet points or lists.');
      }
      if (emojiCount > 0) {
        strengths.push(`Uses visual breaks (${emojiCount} emojis) to improve scannability.`);
      }
      if (paragraphs.length > 1) {
        strengths.push(`Well-spaced with ${paragraphs.length} distinct paragraph breaks.`);
      }
      if (strengths.length === 0) {
        strengths.push('Clear, readable topic messaging.');
      }

      // Weaknesses for standard posts (MUTUALLY EXCLUSIVE WITH STRENGTHS)
      if (!questionHook) {
        weaknesses.push('Opening line lacks a high-impact curiosity hook or bold claim.');
      }
      if (!hasCTA) {
        weaknesses.push('Missing explicit call to action to convert readers into comments or shares.');
      }
      if (words.length > 300) {
        weaknesses.push('Text length is long for standard feed scrolling retention.');
      }
      if (paragraphs.length === 1 && words.length > 50) {
        weaknesses.push('Dense block of text without paragraph breaks.');
      }
      if (emojiCount === 0) {
        weaknesses.push('Lacks visual breaks or emoji highlights for mobile readers.');
      }
    }

    // Construct Actionable Suggestions & Context-Aware Hooks
    const suggestions: string[] = [];
    let hookSuggestion = '';
    let ctaSuggestion = '';
    let hashtags: string[] = [];

    if (isResume) {
      suggestions.push('Repackage this resume into a 5-slide LinkedIn carousel: (1. Bio Hook, 2. Core Skills, 3. Major Projects, 4. Key Metrics, 5. Contact CTA).');
      suggestions.push('Add an opening personal branding statement highlighting your primary technical stack.');
      suggestions.push('Include a clear professional call to action: "Open to software engineering roles — connect with me!"');

      hookSuggestion = 'Looking for a Software Engineer skilled in Full-Stack & System Design? Here is a breakdown of my key projects & expertise:';
      ctaSuggestion = 'Connect with me on LinkedIn or drop a comment below if your team is hiring! 🚀';
      hashtags = ['#SoftwareEngineering', '#TechCareers', '#JobSearch', '#LinkedInGrowth', '#DeveloperProfile'];
    } else {
      if (!questionHook) {
        suggestions.push('Rewrite the opening sentence into a provocative question or surprising stat to stop the feed scroll.');
      }
      if (!hasCTA) {
        suggestions.push('Add a clear request at the end: "Save this for later" or "Drop your thoughts below!"');
      }
      if (paragraphs.length === 1) {
        suggestions.push('Break text into short 1-2 sentence paragraphs for mobile scannability.');
      }
      suggestions.push('Maintain concise line lengths to keep visual reader retention high.');

      // Extract a meaningful topic noun (avoiding personal names/stop words)
      const meaningfulWords = words
        .map(w => w.replace(/[^a-zA-Z]/g, ''))
        .filter(w => w.length > 3 && !COMMON_STOP_WORDS.has(w.toLowerCase()));

      const topicWord = meaningfulWords[0] ? meaningfulWords[0].toLowerCase() : 'content strategy';
      const capitalizedTopic = topicWord.charAt(0).toUpperCase() + topicWord.slice(1);

      hookSuggestion = questionHook
        ? `Current hook is good. Intensify it: "${firstLine.replace(/\.$/, '')} — Here is the exact breakdown:"`
        : `Are you struggling to optimize your ${capitalizedTopic}? Here are the key insights you need:`;

      ctaSuggestion = hasCTA
        ? 'Enhance current CTA: "Drop a comment below with your thoughts and share this post with your network!"'
        : 'Add this CTA to the end: "Found this valuable? Save this post for later and share your take below! 👇"';

      hashtags = [
        `#${capitalizedTopic.replace(/\s+/g, '')}`,
        '#ContentStrategy',
        '#SocialMediaMarketing',
        '#EngagementTips',
        '#GrowthHacking'
      ];
    }

    // Calculate Readability Metrics
    const avgWordsPerSentence = Math.round(words.length / (sentences.length || 1));
    let readabilityScore = 80;
    let readabilityFeedback = 'Easy to read and scanner-friendly.';

    if (avgWordsPerSentence > 22) {
      readabilityScore = 55;
      readabilityFeedback = 'Sentences are on average long and complex. Shorten sentence structure for mobile readers.';
    } else if (avgWordsPerSentence < 8) {
      readabilityScore = 90;
      readabilityFeedback = 'Pithy and highly punchy sentence structure!';
    }

    // Construct Summary
    const summary = cleanText.length > 220 
      ? cleanText.slice(0, 217).replace(/\s+\S*$/, '') + '...' 
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
 * Gemini AI Analysis Provider
 * Engages Google Generative AI with strict prompt rules prohibiting logical contradictions.
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
  "contentType": "string (e.g. Resume / Professional Profile, Carousel Post, Short Video Script, Single Image Post, LinkedIn Article)",
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

CRITICAL RULES FOR CONSISTENCY:
1. Strengths and weaknesses MUST NEVER CONTRADICT each other.
2. If a call-to-action (CTA) is present, list it as a strength and NEVER list "missing CTA" as a weakness.
3. If no CTA is present, list "missing CTA" as a weakness and NEVER claim a CTA is present in strengths.
4. If the text is a Resume/CV or personal profile, recognize it as "Resume / Professional Profile", do NOT generate generic hooks using a person's name like "Are you struggling with [Name]?", but instead provide personal branding / career carousel recommendations.
5. Respond ONLY with raw valid JSON. No markdown code blocks, no explanation.

Input Text:
"""
${text}
"""`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed: AnalysisOutput = JSON.parse(cleanJson);
      
      // Fallback check: if Gemini JSON lacks core fields, repair via deterministic rules
      if (!parsed.contentType || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.weaknesses)) {
        throw new Error('Gemini output failed schema validation check.');
      }

      return parsed;
    } catch (err) {
      console.warn('[GEMINI AI PROVIDER WARNING] Gemini API call failed or returned malformed JSON. Falling back to deterministic provider.', err);
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
