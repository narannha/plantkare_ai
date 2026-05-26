import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use increased limit for base64 captured images
  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client setup
  const getAiInstance = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server-side GEMINI_API_KEY or VITE_GEMINI_API_KEY are not defined.");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API endpoint for scanning
  app.post("/api/scan", async (req, res) => {
    try {
      const { capturedImage } = req.body;
      if (!capturedImage) {
        return res.status(400).json({ error: "Missing capturedImage field" });
      }

      const ai = getAiInstance();
      if (!ai) {
        return res.status(400).json({ 
          error: "Missing Gemini API Key. Please configure GEMINI_API_KEY or VITE_GEMINI_API_KEY under Settings > Secrets. If you are deploying to Vercel, please add either of these variables in your Vercel Project Dashboard." 
        });
      }

      // Extract base64 completely without the data URL prefix if present
      let base64Data = capturedImage;
      let mimeType = "image/jpeg";
      if (capturedImage.includes(",")) {
        const parts = capturedImage.split(",");
        const prefix = parts[0];
        base64Data = parts[1];
        if (prefix.includes("image/png")) {
          mimeType = "image/png";
        } else if (prefix.includes("image/webp")) {
          mimeType = "image/webp";
        }
      }

      console.log("Analyzing image using 'gemini-3.5-flash' on the server...");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Analyze the facial expression, environment, and overall vibe of this image of a creative person. Base your answer strictly on 4 statuses related to creative block: 'flow' (Saturated Mind - active, slightly chaotic but brilliant), 'fog' (Mental Fog - confused, distracted, unsure), 'drought' (Total Block, Low Energy - tired, frustrated, blank stare), or 'storm' (Excess Pressure - intense, perfect-seeking, stressed). Then estimate their focusLevel (1-100), moodLevel (1-100), blockLevel (1-100), serenity (1-100), and energy (1-100). Return ONLY A VALID JSON MATCHING THIS EXACT SCHEMA AND NOTHING ELSE.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "Must be exactly one of: 'flow', 'fog', 'drought', 'storm'",
              },
              focusLevel: { type: Type.INTEGER },
              moodLevel: { type: Type.INTEGER },
              blockLevel: { type: Type.INTEGER },
              serenity: { type: Type.INTEGER },
              energy: { type: Type.INTEGER },
            },
            required: ["status", "focusLevel", "moodLevel", "blockLevel", "serenity", "energy"],
          },
        },
      });

      console.log("Gemini API server-side analysis response text:", response.text);
      let parsedJson;
      try {
        parsedJson = JSON.parse(response.text || "{}");
      } catch (jsonErr) {
        console.error("Failed to parse Gemini response as JSON:", response.text);
        throw new Error("Invalid response format from AI");
      }

      res.json(parsedJson);
    } catch (err: any) {
      console.error("Server-side handleScan error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Serve static assets or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
