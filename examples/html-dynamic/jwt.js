// jwt.js — firma y verifica tokens cortos (5 min) que el HTML embebido
// presenta al backend para identificarse como un JID específico.
//
// El JWT viaja dentro del HTML (inyectado por el bot al renderizar). Es
// importante que expire rápido porque el HTML podría ser reenviado, capturado
// en screenshots, etc. La rotación se hace emitiendo un nuevo token cada vez
// que el bot genera un mensaje HTML nuevo.
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-cambialo-en-produccion";
const TTL_SECONDS = 5 * 60; // 5 minutos

export function issueToken(jid) {
  return jwt.sign({ jid }, SECRET, { expiresIn: TTL_SECONDS });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return { ok: true, jid: payload.jid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
