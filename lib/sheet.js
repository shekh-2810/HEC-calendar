import { getRows } from "./googleSheets";

// How many days before an exam should light up yellow.
const EXAM_WARNING_DAYS = 2;

// Priority when a single date has more than one thing going on.
// exam beats warning beats sport beats event.
const COLOR_PRIORITY = ["red", "yellow", "blue", "green"];

const TYPE_COLOR = {
  exam: "red",
  event: "green",
  sport: "blue",
  hpl: "blue",
};

// Accepts ISO (2026-09-11) as the primary format, but also falls back to
// whatever the JS Date parser can make sense of (e.g. 11/09/2026 as
// exported by a differently-formatted sheet cell).
function toIsoDate(raw) {
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Turns the raw sheet rows into { [isoDate]: { color, items: [...] } }
export function buildCalendarMap(rows) {
  // Expect header row: Date, Type, Title, Details (Details optional, any
  // extra columns are ignored).
  const [header, ...body] = rows;
  if (!header) return {};

  const idx = {
    date: header.findIndex((h) => h.toLowerCase().startsWith("date")),
    type: header.findIndex((h) => h.toLowerCase().startsWith("type")),
    title: header.findIndex((h) => h.toLowerCase().startsWith("title")),
    details: header.findIndex((h) => h.toLowerCase().startsWith("detail")),
  };

  const entries = [];
  for (const row of body) {
    const rawDate = idx.date >= 0 ? row[idx.date] : null;
    const rawType = idx.type >= 0 ? row[idx.type] : null;
    const iso = toIsoDate(rawDate);
    if (!iso || !rawType) continue;

    const type = rawType.trim().toLowerCase();
    entries.push({
      date: iso,
      type,
      title: (idx.title >= 0 ? row[idx.title] : "") || "",
      details: (idx.details >= 0 ? row[idx.details] : "") || "",
    });
  }

  const map = {};

  const ensureDay = (iso) => {
    if (!map[iso]) map[iso] = { colors: new Set(), items: [] };
    return map[iso];
  };

  for (const e of entries) {
    const baseColor = TYPE_COLOR[e.type];
    if (!baseColor) continue; // unknown type in the sheet, skip quietly

    const day = ensureDay(e.date);
    day.colors.add(baseColor);
    day.items.push(e);

    if (e.type === "exam") {
      for (let n = 1; n <= EXAM_WARNING_DAYS; n++) {
        const warnIso = addDaysIso(e.date, -n);
        ensureDay(warnIso).colors.add("yellow");
      }
    }
  }

  const result = {};
  for (const [iso, day] of Object.entries(map)) {
    const color = COLOR_PRIORITY.find((c) => day.colors.has(c)) || null;
    result[iso] = { color, items: day.items };
  }
  return result;
}

export async function fetchCalendarData() {
  const rows = await getRows();
  return buildCalendarMap(rows);
}
