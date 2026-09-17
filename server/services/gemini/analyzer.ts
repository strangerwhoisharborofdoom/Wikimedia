import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface GeminiAnalysisResult {
  hasEvidence: boolean;
  textualSentence: string;
  extractedValue: string;
  isMismatch: boolean;
  explanation: string;
  sourceData: string;
  textualEvidence: string;
  modelInterpretation: string;
  confidenceScore: number;
}

/**
 * Uses Gemini 3.8 Flash to analyze nuanced statements, identify complex textual evidence,
 * and provide an explainable semantic reconciliation while preserving strict data traceability.
 */
export async function analyzeNuancedEvidenceWithGemini(
  fieldName: string,
  structuredValue: string,
  articleSummary: string,
  relevantPassages: string
): Promise<GeminiAnalysisResult | null> {
  const client = getAIClient();
  if (!client) {
    return null; // Gracefully fallback to deterministic layered comparison
  }

  const prompt = `You are an evidence verification assistant for WikiFact Lens, a research tool analyzing Wikipedia structured infobox facts against article text.
Strict Rules:
1. NEVER declare that a fact is "false" or "wrong".
2. Your task is to extract candidate statements from the provided article text and evaluate consistency with the structured value.
3. If a difference exists, the primary conclusion MUST be "Possible mismatch detected."
4. If no relevant evidence is found in the text, return hasEvidence=false.
5. Do NOT invent, assume, or synthesize facts not present in the article text.

Field Name: "${fieldName}"
Structured Infobox Value: "${structuredValue}"
Article Summary: "${articleSummary}"
Relevant Article Passages:
"""
${relevantPassages}
"""

Respond ONLY with valid JSON conforming to this schema:
{
  "hasEvidence": boolean,
  "textualSentence": "The exact sentence from the article text containing the evidence",
  "extractedValue": "The specific value/statement extracted from that sentence",
  "isMismatch": boolean,
  "explanation": "Objective explanation of how the values compare and why they might differ",
  "sourceData": "Field and value from structured infobox",
  "textualEvidence": "Verbatim quote and extracted statement from the text",
  "modelInterpretation": "Semantic reconciliation or verification note requiring human review",
  "confidenceScore": number (0 to 100 integer representing evidence clarity)
}`;

  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const callPromise = (async () => {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text) as GeminiAnalysisResult;
    })();

    const result = await Promise.race([callPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn('[GeminiAnalyzer] Analysis request failed, falling back to deterministic engine:', err);
    return null;
  }
}
