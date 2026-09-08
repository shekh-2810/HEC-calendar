import { google } from "googleapis";

const HEADER = ["Date", "Type", "Title", "Details"];

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it in your Vercel project's environment variables.`);
  return v;
}

function getRange() {
  const tab = process.env.GOOGLE_SHEET_TAB_NAME || "Sheet1";
  return `${tab}!A:D`;
}

async function getSheetsClient() {
  const email = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = env("GOOGLE_SERVICE_ACCOUNT_KEY");
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT(email, undefined, key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

// Returns the raw rows (header + data rows) exactly like a CSV parse would,
// so it plugs straight into buildCalendarMap().
export async function getRows() {
  const sheets = await getSheetsClient();
  const spreadsheetId = env("GOOGLE_SHEET_ID");
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getRange(),
  });
  const values = res.data.values || [];
  if (values.length === 0) return [HEADER];
  return values;
}

// Appends one entry as a new row at the bottom of the sheet.
export async function appendRow({ date, type, title, details }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = env("GOOGLE_SHEET_ID");
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: getRange(),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[date, type, title || "", details || ""]] },
  });
}

// Deletes one row by its 0-based index in the sheet (0 = header row).
// Callers should always re-fetch entries right before deleting to keep
// this index accurate.
export async function deleteRow(rowIndex) {
  if (!Number.isInteger(rowIndex) || rowIndex < 1) {
    throw new Error("Refusing to delete the header row or an invalid row index.");
  }
  const sheets = await getSheetsClient();
  const spreadsheetId = env("GOOGLE_SHEET_ID");
  const sheetId = Number(process.env.GOOGLE_SHEET_GID || 0);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}
