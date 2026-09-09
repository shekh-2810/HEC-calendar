import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "calendar.json");

const DEFAULT_DATA = [
  { date: "2026-09-11", type: "Event", title: "AURA '26", details: "6 PM to 10 PM — Open Auditorium" },
  { startDate: "2026-08-10", endDate: "2026-08-18", type: "Exam", title: "CAT-1", details: "Fall Semester 26-27 — Common for 2022, 2023, 2024 & 2025 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024 & 2025 admitted B.Tech.; 2024 & 2025 admitted B.B.A.; 2026 & 2025 admitted M.Tech., M.C.A. & M.B.A." },
  { startDate: "2026-09-21", endDate: "2026-09-28", type: "Exam", title: "CAT-2", details: "Fall Semester 26-27 — Common for 2022, 2023, 2024 & 2025 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024 & 2025 admitted B.Tech.; 2024 & 2025 admitted B.B.A.; 2026 & 2025 admitted M.Tech., M.C.A. & M.B.A." },
  { startDate: "2026-10-14", endDate: "2026-10-31", type: "Exam", title: "FAT — Term End Examination", details: "Fall Semester 26-27 — Common for 2022, 2023, 2024 & 2025 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024 & 2025 admitted B.Tech.; 2024 & 2025 admitted B.B.A.; 2026 & 2025 admitted M.Tech., M.C.A. & M.B.A." },
  { startDate: "2026-09-07", endDate: "2026-09-09", type: "Exam", title: "CAT-1", details: "Fall Semester 26-27 — Common for 2026 admitted B.Tech., Int. M.Tech., B.Arch. & B.B.A." },
  { startDate: "2026-10-05", endDate: "2026-10-07", type: "Exam", title: "CAT-2", details: "Fall Semester 26-27 — Common for 2026 admitted B.Tech., Int. M.Tech., B.Arch. & B.B.A." },
  { startDate: "2026-10-19", endDate: "2026-10-30", type: "Exam", title: "FAT — Term End Examination", details: "Fall Semester 26-27 — Common for 2026 admitted B.Tech., Int. M.Tech., B.Arch. & B.B.A." },
  { startDate: "2026-12-17", endDate: "2026-12-24", type: "Exam", title: "CAT-1", details: "Winter Semester 26-27 — Common for 2022, 2023, 2024, 2025 & 2026 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024, 2025 & 2026 admitted B.Tech.; 2024, 2025 & 2026 admitted B.B.A.; 2026 B.Tech., Int. M.Tech., B.Arch., B.B.A. & M.Tech." },
  { startDate: "2027-02-05", endDate: "2027-02-12", type: "Exam", title: "CAT-2", details: "Winter Semester 26-27 — Common for 2022, 2023, 2024, 2025 & 2026 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024, 2025 & 2026 admitted B.Tech.; 2024, 2025 & 2026 admitted B.B.A.; 2026 B.Tech., Int. M.Tech., B.Arch., B.B.A. & M.Tech." },
  { startDate: "2027-03-11", endDate: "2027-03-31", type: "Exam", title: "FAT — Term End Examination", details: "Winter Semester 26-27 — Common for 2022, 2023, 2024, 2025 & 2026 admitted Int. M.Tech. & B.Arch.; 2022, 2023 & 2024 admitted Int. M.Sc.; 2023, 2024, 2025 & 2026 admitted B.Tech.; 2024, 2025 & 2026 admitted B.B.A.; 2026 B.Tech., Int. M.Tech., B.Arch., B.B.A. & M.Tech." }
];

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); }
  catch { await writeEntries(DEFAULT_DATA); }
}

async function writeEntries(entries) {
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(entries, null, 2) + "\n", "utf8");
  await fs.rename(tmp, DATA_FILE);
}

export async function getEntries() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export async function replaceEntries(entries) {
  const normalized = normalizeEntries(entries);
  await writeEntries(normalized);
  return normalized;
}

export async function appendEntry(entry) {
  const entries = await getEntries();
  const normalized = normalizeEntry(entry);
  entries.push(normalized);
  await writeEntries(entries);
  return normalized;
}

export async function updateEntry(index, entry) {
  const entries = await getEntries();
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) throw new Error("Invalid entry index.");
  entries[index] = normalizeEntry(entry);
  await writeEntries(entries);
  return entries[index];
}

export async function deleteEntry(index) {
  const entries = await getEntries();
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) throw new Error("Invalid entry index.");
  const [removed] = entries.splice(index, 1);
  await writeEntries(entries);
  return removed;
}

export async function exportCsv() {
  const entries = await getEntries();
  const header = ["Start Date", "End Date", "Type", "Title", "Batches / Years", "Details"];
  const rows = [header, ...entries.map((e) => [e.startDate, e.endDate, e.type, e.title, e.batches, e.details])];
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

export function normalizeEntries(entries) {
  if (!Array.isArray(entries)) throw new Error("Calendar data must be an array.");
  return entries.map(normalizeEntry);
}

export function normalizeEntry(entry) {
  const legacyDate = String(entry?.date ?? "").trim();
  const startDate = String(entry?.startDate ?? legacyDate).trim();
  const endDate = String(entry?.endDate ?? startDate).trim();
  const type = String(entry?.type ?? "").trim();
  const title = String(entry?.title ?? "").trim();
  const details = String(entry?.details ?? "").trim();
  const batches = String(entry?.batches ?? entry?.batch ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Dates must use YYYY-MM-DD.");
  if (endDate < startDate) throw new Error("End date cannot be before start date.");
  if (!type) throw new Error("Type is required.");
  if (!title) throw new Error("Title is required.");
  return { startDate, endDate, type, title, details, batches };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const useful = rows.filter((r) => r.some((v) => String(v).trim() !== ""));
  if (!useful.length) return [];

  const header = useful[0].map((h) => String(h).trim().toLowerCase());
  const idx = {
    date: header.findIndex((h) => h === "date"),
    startDate: header.findIndex((h) => h === "start date" || h === "startdate"),
    endDate: header.findIndex((h) => h === "end date" || h === "enddate"),
    type: header.findIndex((h) => h === "type" || h.startsWith("type")),
    title: header.findIndex((h) => h === "title" || h.startsWith("title")),
    batches: header.findIndex((h) => h === "batches / years" || h === "batches" || h === "batch" || h === "years"),
    details: header.findIndex((h) => h === "details" || h.startsWith("detail")),
  };
  if ((idx.date < 0 && idx.startDate < 0) || idx.type < 0 || idx.title < 0) throw new Error("CSV needs Date OR Start Date/End Date, plus Type, Title and optional Details.");

  return useful.slice(1).map((r) => ({
    date: idx.date >= 0 ? r[idx.date] || "" : "",
    startDate: idx.startDate >= 0 ? r[idx.startDate] || "" : "",
    endDate: idx.endDate >= 0 ? r[idx.endDate] || "" : "",
    type: idx.type >= 0 ? r[idx.type] || "" : "",
    title: idx.title >= 0 ? r[idx.title] || "" : "",
    batches: idx.batches >= 0 ? r[idx.batches] || "" : "",
    details: idx.details >= 0 ? r[idx.details] || "" : "",
  }));
}

export const DEFAULT_ENTRIES = DEFAULT_DATA;
