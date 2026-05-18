import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route for Halal Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, lang } = req.body;
      if (!image) return res.status(400).json({ error: "No image provided" });

      const langNames: Record<string, string> = {
        ar: 'Arabic',
        en: 'English',
        fr: 'French',
        es: 'Spanish'
      };

      const prompt = `
        Analyze the food ingredients list and nutritional facts in this image.
        
        1. Determine if the product is:
           - "HALAL": All ingredients are halal.
           - "HARAM": Contains prohibited ingredients (pork-derived, non-allowed alcohol, non-slaughtered animals).
           - "MASHBOOH": Contains doubtful ingredients.
        
        2. Extract nutritional values per 100g if available in the image. 
           Include: Energy (kcal), Protein (g), Fat (g), Carbohydrates (g), Sugars (g), and Salt (g).
           If not found, use estimated values based on typical products or leave null.

        Provide detailed analysis in ${langNames[lang] || 'English'}.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              productName: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              haramIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING },
              advice: { type: Type.STRING },
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  energy: { type: Type.STRING, description: "Energy in kcal per 100g" },
                  protein: { type: Type.STRING, description: "Protein in g per 100g" },
                  fat: { type: Type.STRING, description: "Fat in g per 100g" },
                  carbs: { type: Type.STRING, description: "Carbohydrates in g per 100g" },
                  sugar: { type: Type.STRING, description: "Sugars in g per 100g" },
                  salt: { type: Type.STRING, description: "Salt in g per 100g" }
                }
              }
            },
            required: ["status", "ingredients", "reasoning", "advice"]
          }
        }
      });

      const responseText = result.text;
      if (!responseText) throw new Error("Empty response from AI");
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("AI Analysis Detailed Error:", JSON.stringify(error, null, 2));
      
      // Extract meaningful error info
      const status = error.status || 500;
      let message = "Internal server error during analysis";
      
      if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      } else if (error.message) {
        message = error.message;
      }

      res.status(status).json({ error: message });
    }
  });

  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // API Route to get Google Auth URL
  app.get("/api/auth/google/url", (req, res) => {
    const origin = req.headers.referer || req.headers.origin || "";
    // We use the origin from the request or APP_URL if available
    const appUrl = process.env.APP_URL || origin.replace(/\/$/, "");
    const redirectUri = `${appUrl}/auth/google/callback`;

    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      redirect_uri: redirectUri,
    });
    res.json({ url });
  });

  // Google Callback Handler
  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const origin = `${req.protocol}://${req.get("host")}`;
    const appUrl = process.env.APP_URL || origin;
    const redirectUri = `${appUrl}/auth/google/callback`;

    try {
      const { tokens } = await googleClient.getToken({
        code: code as string,
        redirect_uri: redirectUri,
      });
      googleClient.setCredentials(tokens);

      const userInfoResponse = await googleClient.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      });

      const userData = userInfoResponse.data;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(userData)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
