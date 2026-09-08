import { isRequestAuthenticated } from "@/lib/auth";
import { appendEntry } from "@/lib/dataStore";

export async function POST(request) {
  if (!isRequestAuthenticated(request)) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    const body = await request.json();
    const entry = await appendEntry(body || {});
    return Response.json({ ok: true, entry });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Could not add entry." }, { status: 400 });
  }
}
