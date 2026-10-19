import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (!requestOrigin || requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return requestOrigin && requestOrigin !== allowedOrigin
      ? res.sendStatus(403)
      : res.sendStatus(204);
  }

  if (requestOrigin && requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  return next();
});

app.use(express.json());

let client;

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  return client;
}

app.post("/chat", async (req, res) => {
  const { message } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }

  const openRouterClient = getClient();

  if (!openRouterClient) {
    return res.status(503).json({ error: "OPENROUTER_API_KEY is not configured." });
  }

  try {
    const response = await openRouterClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response?.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || reply.trim().length === 0) {
      console.error("Malformed OpenRouter response", {
        hasChoices: Array.isArray(response?.choices),
        firstChoiceType: typeof response?.choices?.[0],
      });
      return res.status(502).json({ error: "Invalid response from chat provider." });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("OpenRouter request failed", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    return res.status(502).json({ error: "Unable to generate chat reply right now." });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

export { app };
export default app;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
