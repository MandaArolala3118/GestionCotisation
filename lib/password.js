import bcrypt from 'bcryptjs';

// bcrypt utilise des API Node.js (setImmediate...) : ce fichier ne doit
// jamais être importé depuis middleware.js (Edge Runtime). Il n'est utilisé
// que par les routes API (Node.js runtime classique).

export async function hashPassword(motDePasse) {
  return bcrypt.hash(motDePasse, 10);
}

export async function verifyPassword(motDePasse, hash) {
  return bcrypt.compare(motDePasse, hash);
}
