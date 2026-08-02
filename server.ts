import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createPool } from "./src/db/index.ts";
import { initDatabaseTables } from "./src/db/init.ts";
import { fetchAllDatabaseState, upsertDocumentSQL } from "./src/db/queries.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Cloud SQL Health & Connectivity Check
app.get("/api/sql/health", async (_req, res) => {
  try {
    if (!process.env.SQL_HOST || !process.env.SQL_DB_NAME) {
      return res.json({ connected: false, reason: "Cloud SQL credentials not set in runtime environment" });
    }
    const pool = createPool();
    await initDatabaseTables();
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT NOW() as current_time");
      return res.json({
        connected: true,
        time: result.rows[0].current_time,
        database: process.env.SQL_DB_NAME,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Cloud SQL health check failed:", err);
    return res.status(500).json({
      connected: false,
      error: err.message || "Database connection failed",
    });
  }
});

// Fetch all state from Cloud SQL
app.get("/api/sql/sync", async (_req, res) => {
  try {
    const data = await fetchAllDatabaseState();
    res.json(data);
  } catch (err: any) {
    console.error("Error fetching SQL database state:", err);
    res.status(500).json({ error: err.message || "Failed to fetch from Cloud SQL" });
  }
});

// Upsert a document/record into Cloud SQL
app.post("/api/sql/save", async (req, res) => {
  try {
    const { collectionName, item } = req.body;
    if (!collectionName || !item) {
      return res.status(400).json({ error: "collectionName and item are required." });
    }
    await upsertDocumentSQL(collectionName, item);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving document to Cloud SQL:", err);
    res.status(500).json({ error: err.message || "Failed to save to Cloud SQL" });
  }
});

// AI Insights endpoint for inventory optimization, reorder alerts, trend analysis
app.post("/api/ai/insights", async (req, res) => {
  try {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API Key is missing in environment secrets.",
      });
    }

    const { salesSummary, inventorySummary, storeLocations } = req.body;

    const prompt = `You are an expert AI Apparel & Fashion Inventory Analyst for an apparel boutique chain called "Threads & Style".
Analyze the provided store performance and inventory matrix data below:

Stores: ${JSON.stringify(storeLocations || [])}
Sales Summary: ${JSON.stringify(salesSummary || {})}
Inventory Summary: ${JSON.stringify(inventorySummary || [])}

Provide actionable, highly practical insights formatted in JSON with the following structure:
{
  "summaryHeadline": "string (e.g. 'Strong Denim demand at Downtown, Silk dresses low stock in Medium')",
  "topTrendObservation": "string summary of best performers (colors, sizes, styles)",
  "reorderAlerts": [
    {
      "styleName": "string",
      "recommendedAction": "string (e.g. 'Reorder 25 units of Navy / Size M')",
      "reason": "string"
    }
  ],
  "slowMovingMarkdownAdvice": [
    {
      "styleName": "string",
      "variantInfo": "string",
      "suggestedDiscount": "string (e.g. '15% off bundle discount')"
    }
  ],
  "multiStoreTransferAdvice": [
    {
      "fromStore": "string",
      "toStore": "string",
      "item": "string",
      "quantity": "number"
    }
  ],
  "loyaltyStrategyNote": "string recommendation to boost repeat purchases"
}
Ensure response is strictly valid JSON without markdown wrapping or code block syntax.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    // clean codeblock markers if present
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);
    return res.json({ success: true, insights: data });
  } catch (err: any) {
    console.error("Error generating AI insights:", err);
    return res.status(500).json({
      error: "Failed to generate AI insights: " + (err.message || String(err)),
    });
  }
});

// AI Outfit & Cross-sell Recommendation endpoint
app.post("/api/ai/recommend-outfit", async (req, res) => {
  try {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API Key is missing.",
      });
    }

    const { customerProfile, currentCart, availableProducts } = req.body;

    const prompt = `You are a personal fashion stylist assistant at Threads & Style Boutique.
Customer Info: ${JSON.stringify(customerProfile || { name: "Guest" })}
Current Cart Items: ${JSON.stringify(currentCart || [])}
Catalog Products: ${JSON.stringify(availableProducts || [])}

Suggest 2-3 complementary items or style advice that fit the customer's size preferences and current outfit choices.
Return JSON in this format:
{
  "stylistNote": "string warm advice for the customer",
  "recommendedItems": [
    {
      "styleName": "string match from catalog",
      "reasoning": "why it complements their chosen look",
      "suggestedSize": "string"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    return res.json({ success: true, recommendation: data });
  } catch (err: any) {
    console.error("Error generating outfit recommendation:", err);
    return res.status(500).json({ error: "Failed to fetch recommendation." });
  }
});

// Start Express + Vite Middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
