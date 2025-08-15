import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn('GOOGLE_API_KEY is not set. Set it in .env.local');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export type AnalysisResult = {
  score: number;
  sections: Record<string, string[]>; // section -> recommendations
  missingKeywords: string[];
  optimizedResume: string; // HTML or Markdown
};

export async function analyzeWithGemini(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const rubric = `Rubric:
  - sections: Provide concrete, actionable recommendations grouped by: Summary, Skills, Experience, Education. Each as an array of short bullet sentences.
  - missingKeywords: Extract up to 20 role-specific keywords present in the JD but not clearly present in the resume.
  - optimizedResume: Provide clean, ATS-friendly HTML (no external CSS) with simple headings and bullet lists.
  Return strictly JSON with keys: score (0-100), sections (object), missingKeywords (string[]), optimizedResume (string).`;

  const prompt = `You are an expert ATS resume optimizer. Compare this resume and job description and produce the JSON described. ${rubric}

Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nReturn only JSON.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const parsed = JSON.parse(text);
    // Basic validation
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      sections: parsed.sections || {},
      missingKeywords: parsed.missingKeywords || [],
      optimizedResume: parsed.optimizedResume || '',
    };
  } catch {
    // If the model returned markdown fenced JSON or extra text, try to extract JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
  const parsed = JSON.parse(match[0]);
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
        sections: parsed.sections || {},
        missingKeywords: parsed.missingKeywords || [],
        optimizedResume: parsed.optimizedResume || '',
      };
    }
    // one light retry with an explicit JSON fence instruction
    const retry = await model.generateContent(`${prompt}\n\nReturn ONLY a single JSON object without code fences or commentary.`);
    const retryText = retry.response.text();
    const jsonMatch = retryText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
        sections: parsed.sections || {},
        missingKeywords: parsed.missingKeywords || [],
        optimizedResume: parsed.optimizedResume || '',
      };
    }
    throw new Error('Failed to parse Gemini response');
  }
}
