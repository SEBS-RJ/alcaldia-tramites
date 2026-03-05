// ─── Servicio de Hash (T-05 HU-1) ────────────────────────────────────────────
// Genera un hash SHA-256 idéntico al que usa PostgreSQL con sha256()::bytea
// Esto garantiza que la comparación en la BD sea correcta.

/**
 * Convierte un texto a SHA-256 en hexadecimal.
 * Equivale a: encode(sha256(texto::bytea), 'hex') en PostgreSQL.
 */
export async function hashSHA256(texto: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}