import { isRequestAuthenticated } from "@/lib/auth";
import { deleteEntry } from "@/lib/dataStore";

export async function POST(request) {
  if (!isRequestAuthenticated(request)) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    const body = await request.json();
    const index = Number(body?.index);
    const removed = await deleteEntry(index);
    return Response.json({ ok: true, removed });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Could not delete entry." }, { status: 400 });
  }
}
