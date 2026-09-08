"use client";

import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LEGEND = [
  { color: "red", label: "Exam day" },
  { color: "yellow", label: "Exam coming up" },
  { color: "green", label: "Event" },
  { color: "blue", label: "Sports (HPL)" },
];

function toIso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Monday-first grid of a given month, including the lead-in/lead-out days
// from neighbouring months needed to fill whole weeks.
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, i - startOffset + 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

export default function Page() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [days, setDays] = useState({});
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedIso, setSelectedIso] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setDays(data.days);
          setStatus("ok");
        } else {
          setErrorMsg(data.error || "Something went wrong.");
          setStatus("error");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || "Could not reach the calendar.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const goToMonth = (delta) => {
    setCursor((c) => {
      const m = c.month + delta;
      const year = c.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  };

  const selectedItems = selectedIso ? days[selectedIso]?.items || [] : [];

  return (
    <main className="page">
      <header className="top">
        <h1>HEC Calendar</h1>
        <ul className="legend">
          {LEGEND.map((l) => (
            <li key={l.color}>
              <span className={`dot dot-${l.color}`} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      </header>

      <div className="nav">
        <button type="button" onClick={() => goToMonth(-1)} aria-label="Previous month">
          &larr;
        </button>
        <div className="nav-label">
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </div>
        <button type="button" onClick={() => goToMonth(1)} aria-label="Next month">
          &rarr;
        </button>
        <button
          type="button"
          className="today-btn"
          onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
        >
          Today
        </button>
      </div>

      {status === "loading" && <p className="status">Loading calendar…</p>}
      {status === "error" && (
        <p className="status status-error">
          Couldn&rsquo;t load the calendar. {errorMsg}
        </p>
      )}

      {status === "ok" && (
        <>
          <div className="weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w} className="weekday">
                {w}
              </div>
            ))}
          </div>

          <div className="grid">
            {grid.map(({ date, inMonth }) => {
              const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
              const info = days[iso];
              const isToday = iso === todayIso;
              const isSelected = iso === selectedIso;

              return (
                <button
                  key={iso}
                  type="button"
                  className={[
                    "cell",
                    inMonth ? "" : "cell-out",
                    isToday ? "cell-today" : "",
                    isSelected ? "cell-selected" : "",
                    info ? `cell-${info.color}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedIso(info ? iso : null)}
                >
                  <span className="cell-date">{date.getDate()}</span>
                  {info && info.items.length > 0 && (
                    <span className="cell-title">
                      {info.items[0].title || info.items[0].type}
                      {info.items.length > 1 ? ` +${info.items.length - 1}` : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedIso && (
            <section className="details">
              <h2>{selectedIso}</h2>
              {selectedItems.length === 0 ? (
                <p>Nothing on this day.</p>
              ) : (
                <ul>
                  {selectedItems.map((item, i) => (
                    <li key={i}>
                      <span className={`dot dot-${TYPE_TO_COLOR[item.type] || "green"}`} aria-hidden="true" />
                      <div>
                        <strong>{item.title || item.type}</strong>
                        {item.details && <p>{item.details}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <footer className="footer">
        <a href="/admin/login">Team sign-in</a>
      </footer>
    </main>
  );
}

const TYPE_TO_COLOR = {
  exam: "red",
  event: "green",
  sport: "blue",
  hpl: "blue",
};
