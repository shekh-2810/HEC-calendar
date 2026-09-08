import { fetchCalendarData } from "@/lib/calendar";

export async function GET() {
  try {
    const data = await fetchCalendarData();
    return Response.json({ ok: true, days: data });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
