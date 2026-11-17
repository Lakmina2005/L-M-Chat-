import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "4mb" }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.get("/api/health", (_req, res) => {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({ ok: true, aiConfigured: hasGemini });
});

app.post("/api/gemini/style-name", async (req, res) => {
  try {
    const { prompt, currentName } = req.body as {
      prompt?: string;
      currentName?: string;
    };

    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: "Style prompt is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "Server Gemini API key is not configured.",
        code: "NO_API_KEY",
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Convert this visual style prompt into concrete CSS/typography settings for a mobile app title "${currentName || "My App"}": "${prompt.trim()}".`,
      config: {
        systemInstruction:
          "You are a mobile UI typography designer. Return clean JSON matching the schema. Pick tasteful hex colors, valid CSS text-shadow strings, and realistic font sizes (16 to 44).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fontSize: { type: Type.INTEGER },
            fontFamily: {
              type: Type.STRING,
              description:
                "One of: Plus Jakarta Sans, Outfit, JetBrains Mono, Georgia, System UI",
            },
            bold: { type: Type.BOOLEAN },
            italic: { type: Type.BOOLEAN },
            letterSpacing: { type: Type.NUMBER },
            textShadow: { type: Type.STRING },
            gradientEnabled: { type: Type.BOOLEAN },
            gradientFrom: { type: Type.STRING },
            gradientTo: { type: Type.STRING },
            textColor: { type: Type.STRING },
            animation: {
              type: Type.STRING,
              description: "One of: none, pulse, glow, slide, float",
            },
            alignment: {
              type: Type.STRING,
              description: "One of: left, center, right",
            },
            rationale: { type: Type.STRING },
          },
        },
      },
    });

    const raw = (response.text ?? "{}").trim();
    const parsed = JSON.parse(raw);
    res.json({ style: parsed });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate name style.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/gemini/fix-code", async (req, res) => {
  try {
    const { file, language, code, issueMessage, line } = req.body as {
      file?: string;
      language?: string;
      code?: string;
      issueMessage?: string;
      line?: number;
    };

    if (!code) {
      res.status(400).json({ error: "Code content is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "Server Gemini API key is not configured.",
        code: "NO_API_KEY",
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: [
        `File: ${file || "index.html"} (${language || "html"})`,
        `Line: ${line || 1}`,
        `Issue: ${issueMessage || "General syntax or runtime issue"}`,
        "Code:",
        "```",
        code.slice(0, 18000),
        "```",
      ].join("\n"),
      config: {
        systemInstruction:
          "You are a senior web and mobile hybrid app engineer. Fix the provided code cleanly while preserving all user logic. Return strict JSON with explanation, fixedCode (complete corrected file content), and whatChanged.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "Clear explanation of why the error happened.",
            },
            fixedCode: {
              type: Type.STRING,
              description: "Complete corrected source code for the file.",
            },
            whatChanged: {
              type: Type.STRING,
              description: "Concise summary of exact edits made.",
            },
          },
        },
      },
    });

    const raw = (response.text ?? "{}").trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "AI error fixer request failed.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/cloud-build", async (req, res) => {
  try {
    const { webhookUrl, payload } = req.body as {
      webhookUrl?: string;
      payload?: unknown;
    };
    if (!webhookUrl) {
      res.status(400).json({ error: "Build service URL is required." });
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      res.status(400).json({ error: "Invalid build webhook URL." });
      return;
    }
    if (parsedUrl.protocol !== "https:") {
      res.status(400).json({
        error: "Cloud Build endpoint must use HTTPS.",
      });
      return;
    }

    const upstream = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    const text = await upstream.text();
    res.status(upstream.status).json({
      ok: upstream.ok,
      status: upstream.status,
      body: text.slice(0, 2000),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Cloud build dispatch failed.";
    res.status(502).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`APP FORGE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
