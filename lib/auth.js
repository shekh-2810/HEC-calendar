import crypto from "crypto";

const COOKIE_NAME = "hec_admin_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return s;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

// token = "<expiresAtMs>.<hmac>"
export function createSessionToken() {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;

  let expected;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export function sessionCookieHeader(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.SECURE_COOKIES === "true") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export function readSessionTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return match.slice(COOKIE_NAME.length + 1);
}

export function isRequestAuthenticated(request) {
  const token = readSessionTokenFromCookieHeader(request.headers.get("cookie"));
  return isValidSessionToken(token);
}

export { COOKIE_NAME };

