import { isRequestAuthenticated } from "@/lib/auth";
import { getEntries, parseCsv, replaceEntries, normalizeEntries } from "@/lib/dataStore";

export async function POST(request) {
  if (!isRequestAuthenticated(request)) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const mode = String(form.get("mode") || "replace");
    if (!file || typeof file.text !== "function") return Response.json({ ok: false, error: "Choose a CSV or JSON file." }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return Response.json({ ok: false, error: "File is too large. Maximum is 2 MB." }, { status: 400 });
    const text = await file.text();
    const name = String(file.name || "").toLowerCase();
    const imported = name.endsWith(".json") ? JSON.parse(text) : parseCsv(text);
    const normalized = normalizeEntries(imported);
    if (!normalized.length) return Response.json({ ok: false, error: "The file contains no calendar entries." }, { status: 400 });
    const finalEntries = mode === "append" ? [...await getEntries(), ...normalized] : normalized;
    await replaceEntries(finalEntries);
    return Response.json({ ok: true, imported: normalized.length, total: finalEntries.length, mode });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "Could not import the file." }, { status: 400 });
  }
}
