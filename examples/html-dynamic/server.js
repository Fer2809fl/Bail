// server.js — backend HTTP mínimo para el ejemplo html-dynamic.
//
// Recibe los puntajes enviados desde el WebView (vía fetch a este dominio,
// que debe estar listado en `trustedSources` del bot). El JID del usuario
// se extrae del JWT, no del cuerpo del request — el cliente no puede
// falsificar su identidad.
import express from "express";
import cors from "cors";
import { submitScore, getBest, getTopPlayers, initSchema } from "./db.js";
import { verifyToken } from "./jwt.js";

initSchema();

const app = express();
app.use(express.json());
app.use(cors()); // el WebView no envía CORS preflight normalmente, pero por las dudas

const PORT = process.env.PORT ?? 3001;
const API_BASE = process.env.API_BASE ?? `http://localhost:${PORT}`;

// Middleware que extrae el jid del Bearer token.
function authJid(req, res, next) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const result = verifyToken(token);
  if (!result.ok) {
    return res.status(401).json({ error: "token_invalid", detail: result.error });
  }
  req.jid = result.jid;
  next();
}

// GET /state — devuelve el estado actual del usuario (best, games_played).
app.get("/state", authJid, (req, res) => {
  res.json({ jid: req.jid, best: getBest(req.jid) });
});

// POST /score — recibe un nuevo score, lo guarda si supera el récord.
app.post("/score", authJid, (req, res) => {
  const score = Math.max(0, Math.floor(Number(req.body?.score) ?? 0));
  if (!Number.isFinite(score)) {
    return res.status(400).json({ error: "score_invalid" });
  }
  const { best, isNewRecord } = submitScore(req.jid, score);
  res.json({ ok: true, best, isNewRecord });
});

// GET /leaderboard — top global. Sin auth (no expone JIDs completos).
app.get("/leaderboard", (req, res) => {
  const top = getTopPlayers(10).map((row, i) => ({
    rank: i + 1,
    name: row.jid.split("@")[0].slice(-4).padStart(4, "*"),
    best: row.best,
  }));
  res.json({ top });
});

app.listen(PORT, () => {
  console.log(`[server] escuchando en ${API_BASE}`);
  console.log(`[server] trustedSources debe incluir: ${new URL(API_BASE).host}`);
});
