import { SignJWT, jwtVerify } from 'jose';

// Uniquement du JWT (jose), compatible Edge Runtime : ce fichier peut être
// importé par middleware.js sans embarquer bcrypt (Node.js only).

export const SESSION_COOKIE_NAME = 'session';
const DUREE_SESSION = '7d';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Variable d'environnement manquante : SESSION_SECRET est requise.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DUREE_SESSION)
    .sign(getSecret());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}
