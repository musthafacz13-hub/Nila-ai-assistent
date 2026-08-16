import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client lazily so it doesn't crash on startup if missing.
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const SYSTEM_PROMPT = `You are Nila, a helpful personal AI assistant for general users in Kerala, India.

You understand:
- Malayalam
- Manglish
- English

Respond naturally in the language used by the user.

Keep answers useful, clear, and concise unless the user asks for detail.

IMPORTANT:
You do not have live/current information. If the user asks for current news, weather, live prices, etc., clearly state that live information tools are not connected yet.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: POST /api/chat
  app.post("/api/chat", async (req, res) => {
    try {
      console.log("[CHAT_REQUEST] Received chat request");
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim() === "") {
        console.error("[CHAT_ERROR] Message is required");
        return res.status(400).json({ error: "Message is required." });
      }

      const truncatedMessage = message.slice(0, 4000); // Reasonable limit

      const aiClient = getGeminiClient();
      
      console.log("[CHAT_GEMINI_REQUEST] Sending request to Gemini API");
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: truncatedMessage,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });

      console.log("[CHAT_GEMINI_RESPONSE] Received response from Gemini API");
      
      const reply = response.text || "I couldn't generate a response.";
      
      console.log("[CHAT_SUCCESS] Successfully generated reply");
      res.json({ reply });
    } catch (error) {
      console.error("[CHAT_ERROR] API error:", error);
      res.status(500).json({ error: "Sorry, I couldn't process that right now. Please try again." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Use * for Express v4 to handle SPA routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
