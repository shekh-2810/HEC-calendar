import { isRequestAuthenticated } from "@/lib/auth";
import { updateEntry } from "@/lib/dataStore";

export async function POST(request) {
  if (!isRequestAuthenticated(request)) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    const body = await request.json();
    const index = Number(body?.index);
    const entry = await updateEntry(index, body?.entry || {});
    return Response.json({ ok: true, entry });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Could not update entry." }, { status: 400 });
  }
}
