import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix paths for ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   1️⃣ BASIC BOT PROTECTION (Level 1)
===================================================== */
const blockedBots = [
  "bot",
  "crawl",
  "spider",
  "slurp",
  "bing",
  "ahrefs",
  "semrush",
  "facebookexternalhit",
  "python-requests",
  "curl",
  "wget",
  "java",
  "headless"
];

app.use((req, res, next) => {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  for (const b of blockedBots) {
    if (ua.includes(b)) {
      return res.status(403).send("Bots are not allowed");
    }
  }
  next();
});

/* =====================================================
   2️⃣ STRICT ACCESS CONTROL
===================================================== */

const ALLOWED_ORIGIN = "https://joiedamour.shop"; // <-- CHANGE THIS

app.use((req, res, next) => {

  // Always allow static assets
  if (
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images")
  ) {
    return next();
  }

  // Always allow API
  if (req.path.startsWith("/frontend-loader")) return next();

  // Allow ?loader=true
  if (req.query.loader === "true") return next();

  // Validate referer
  const referer = req.headers.referer || "";
  if (referer.startsWith(ALLOWED_ORIGIN)) {
    return next();
  }

  // Block everything else
  return res.status(403).send("Access Restricted");
});

/* =====================================================
   3️⃣ FRONTEND LOADER API (Origin + Timezone)
===================================================== */

app.get("/frontend-loader", (req, res) => {
  const tz = req.headers["x-client-timezone"] || "";
  const origin = req.headers.origin || "";

  // Must come from correct website
  if (origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ allowed: false, error: "Invalid origin" });
  }

  // Only allow Japan timezone
  const allowedTZ = ["Asia/Kolkata", "Asia/Calcutta"];
  if (!allowedTZ.includes(tz)) {
    return res.json({ allowed: false, error: "Timezone blocked" });
  }

  return res.json({ allowed: true });
});

/* =====================================================
   4️⃣ STATIC SITE
===================================================== */
app.use(express.static(path.join(__dirname, "public")));

/* =====================================================
   5️⃣ FALLBACK → index.html
===================================================== */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =====================================================
   6️⃣ START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

