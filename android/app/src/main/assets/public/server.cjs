var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_google_auth_library = require("google-auth-library");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, lang } = req.body;
      if (!image) return res.status(400).json({ error: "No image provided" });
      const langNames = {
        ar: "Arabic",
        en: "English",
        fr: "French",
        es: "Spanish"
      };
      const prompt = `
        Analyze the food ingredients list in this image.
        Determine if the product is:
        1. "HALAL": All ingredients are halal.
        2. "HARAM": Contains prohibited ingredients (pork-derived, non-allowed alcohol, non-slaughtered animals).
        3. "MASHBOOH": Contains doubtful ingredients (like E471 without a stated source).

        Provide detailed analysis in ${langNames[lang] || "English"}.
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
            type: import_genai.Type.OBJECT,
            properties: {
              status: { type: import_genai.Type.STRING },
              productName: { type: import_genai.Type.STRING },
              ingredients: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              haramIngredients: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              reasoning: { type: import_genai.Type.STRING },
              advice: { type: import_genai.Type.STRING }
            },
            required: ["status", "ingredients", "reasoning", "advice"]
          }
        }
      });
      const responseText = result.text;
      if (!responseText) throw new Error("Empty response from AI");
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error("AI Analysis Detailed Error:", JSON.stringify(error, null, 2));
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
  const googleClient = new import_google_auth_library.OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  app.get("/api/auth/google/url", (req, res) => {
    const origin = req.headers.referer || req.headers.origin || "";
    const appUrl = process.env.APP_URL || origin.replace(/\/$/, "");
    const redirectUri = `${appUrl}/auth/google/callback`;
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      redirect_uri: redirectUri
    });
    res.json({ url });
  });
  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const origin = `${req.protocol}://${req.get("host")}`;
    const appUrl = process.env.APP_URL || origin;
    const redirectUri = `${appUrl}/auth/google/callback`;
    try {
      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: redirectUri
      });
      googleClient.setCredentials(tokens);
      const userInfoResponse = await googleClient.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo"
      });
      const userData = userInfoResponse.data;
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
