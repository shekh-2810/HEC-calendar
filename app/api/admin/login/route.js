import crypto from "crypto";
import { createSessionToken, sessionCookieHeader } from "@/lib/auth";

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json(
      { ok: false, error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const { password } = body || {};
  if (!password || !safeEqual(password, expected)) {
    return Response.json({ ok: false, error: "Wrong passcode." }, { status: 401 });
  }

  const token = createSessionToken();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookieHeader(token),
    },
  });
}
