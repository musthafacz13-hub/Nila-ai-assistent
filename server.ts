import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";

// Initialize Groq client lazily so it doesn't crash on startup if missing.
let groq: Groq | null = null;
function getGroqClient() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
    groq = new Groq({ apiKey });
  }
  return groq;
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
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ error: "Message is required." });
      }

      const truncatedMessage = message.slice(0, 4000); // Reasonable limit

      const client = getGroqClient();
      
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: truncatedMessage }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
      
      res.json({ reply });
    } catch (error) {
      console.error("Groq API error:", error);
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
