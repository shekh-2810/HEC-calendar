import { fetchCalendarData } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchCalendarData();

    return Response.json(
      { ok: true, days: data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
