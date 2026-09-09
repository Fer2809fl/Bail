// db.js — capa mínima sobre better-sqlite3 para el ejemplo html-dynamic.
// No es una maravilla de arquitectura; está pensada para que se lea en 30
// segundos y se entienda el patrón completo.
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? join(__dirname, "scores.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

export function initSchema() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
}

/**
 * Lee el puntaje máximo guardado para un JID. Si el usuario no existe,
 * devuelve 0 (no crea la fila automáticamente; se crea al primer guardado).
 */
export function getBest(jid) {
  const row = db
    .prepare("SELECT best FROM scores WHERE jid = ?")
    .get(jid);
  return row?.best ?? 0;
}

/**
 * Guarda el puntaje si supera al actual. Devuelve `{ best, isNewRecord }`.
 * Incrementa `games_played` aunque no se supere el récord.
 */
export function submitScore(jid, score) {
  const prev = getBest(jid);
  const isNewRecord = score > prev;
  const best = isNewRecord ? score : prev;
  db.prepare(`
    INSERT INTO scores (jid, best, games_played, updated_at)
    VALUES (?, ?, 1, unixepoch())
    ON CONFLICT(jid) DO UPDATE SET
      best       = MAX(scores.best, excluded.best),
      games_played = scores.games_played + 1,
      updated_at   = excluded.updated_at
  `).run(jid, best);
  return { best, isNewRecord };
}

/**
 * Top N para un leaderboard opcional.
 */
export function getTopPlayers(limit = 10) {
  return db
    .prepare(
      "SELECT jid, best, games_played FROM scores ORDER BY best DESC LIMIT ?",
    )
    .all(limit);
}

if (process.argv[2] === "init") {
  initSchema();
  console.log("✓ Schema inicializado en", DB_PATH);
}

export default db;
