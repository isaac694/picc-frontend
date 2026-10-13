
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

export async function searchWithGemini(
  question: string,
): Promise<string> {
  if (!ai) {
    console.error('GEMINI_API_KEY is not configured.');
    return '';
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
You are a web research assistant supporting the official
Pentecost International Christian Centre (PICC) Assistant.

Search the web for reliable information relevant to the
visitor's question.

VISITOR QUESTION:
${question}

Instructions:
- Use Google Search to find relevant information.
- Prefer official websites and authoritative sources.
- For PICC-specific facts, prioritize official PICC sources.
- Never invent facts or source URLs.
- Clearly distinguish verified information from uncertainty.
- Return a concise summary of the findings.
- Include relevant source URLs when available.
      `.trim(),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text?.trim();

    if (!answer) {
      console.warn('Gemini returned no search-grounded text.');
      return '';
    }

    // Return Gemini's answer, which may contain information
    // grounded in Google Search results.
    return answer;
  } catch (error) {
    console.error('Gemini Google Search failed:', error);
    return '';
  }
}
