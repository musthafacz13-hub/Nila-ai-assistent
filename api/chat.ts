import { GoogleGenAI } from '@google/genai';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

const SYSTEM_PROMPT = `You are Nila, a helpful personal AI assistant for general users in Kerala, India.

You understand Malayalam, Manglish, and English. Respond naturally in the language used by the user.

Keep answers useful, clear, and concise unless the user asks for detail.

You do not have live/current information. If the user asks for current news, weather, live prices, or similar information, clearly state that live information tools are not connected yet.`;

let ai: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = (body as { message?: unknown } | null)?.message;

    if (typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const response = await getGeminiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message.slice(0, 4000),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    res.status(200).json({ reply: response.text || "I couldn't generate a response." });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isMissingKey = message.includes('GEMINI_API_KEY');
    console.error('[CHAT_ERROR]', error);
    res.status(500).json({
      error: isMissingKey
        ? 'Server configuration error: Missing Gemini API Key.'
        : "Sorry, I couldn't process that right now. Please try again.",
    });
  }
}
