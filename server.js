import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: new URL(".env", import.meta.url) });

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// const client = process.env.OPENROUTER_API_KEY
//   ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY })
//   : null;
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});


app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!client) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4o
      messages: [{ role: "user", content: message }]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("backend is running");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// import express from "express";
// import Anthropic from "@anthropic-ai/sdk";
// import dotenv from "dotenv";
// import cors from "cors";


// dotenv.config({ path: new URL(".env", import.meta.url) });

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: "http://localhost:5173" }));
// app.use(express.json());

// const client = process.env.ANTHROPIC_API_KEY
//   ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
//   : null;

// app.post("/chat", async (req, res) => {
//   try {
//     const { message } = req.body;

//     if (!client) {
//       return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured." });
//     }

//     if (!message || !message.trim()) {
//       return res.status(400).json({ error: "Message is required." });
//     }

//     const response = await client.messages.create({
//       model: "claude-3-opus-20240229", // or claude-3-sonnet, claude-3-haiku
//       max_tokens: 500,
//       messages: [{ role: "user", content: message }]
//     });

//     res.json({ reply: response.content[0].text });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
