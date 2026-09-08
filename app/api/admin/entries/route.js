import { isRequestAuthenticated } from "@/lib/auth";
import { getEntries } from "@/lib/dataStore";

export async function GET(request) {
  if (!isRequestAuthenticated(request)) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    const entries = await getEntries();
    return Response.json({
      ok: true,
      entries: entries.map((entry, index) => ({ ...entry, index })).reverse(),
    });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Could not load entries." }, { status: 500 });
  }
}
