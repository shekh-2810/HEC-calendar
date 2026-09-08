"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY_FORM = { startDate: "", endDate: "", type: "Exam", title: "", details: "" };

export default function AdminDashboard() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [entries, setEntries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadEntries = async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/admin/entries", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load entries.");
      setEntries(data.entries);
      setLoadState("ok");
    } catch (err) {
      setLoadError(err.message || "Could not load entries.");
      setLoadState("error");
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const endpoint = editing === null ? "/api/admin/add" : "/api/admin/update";
    const body = editing === null ? form : { index: editing, entry: form };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not save entry.");
      setForm(EMPTY_FORM); setEditing(null); setMessage(editing === null ? "Entry added." : "Entry updated."); await loadEntries();
    } catch (err) { setError(err.message || "Could not save entry."); }
    finally { setBusy(false); }
  };

  const removeEntry = async (index, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setError(""); setMessage("");
    try {
      const res = await fetch("/api/admin/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not delete entry.");
      if (editing === index) { setEditing(null); setForm(EMPTY_FORM); }
      setMessage("Entry deleted."); await loadEntries();
    } catch (err) { setError(err.message || "Could not delete entry."); }
  };

  const editEntry = (entry) => {
    setEditing(entry.index);
    setForm({ startDate: entry.startDate, endDate: entry.endDate, type: entry.type, title: entry.title, details: entry.details });
    setMessage(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const upload = async (e) => {
    e.preventDefault();
    const file = e.currentTarget.file.files[0];
    if (!file) return;
    setUploading(true); setError(""); setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", e.currentTarget.mode.value);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not import file.");
      e.currentTarget.reset();
      setMessage(`${data.imported} entries imported (${data.mode}). ${data.total} total entries.`);
      await loadEntries();
    } catch (err) { setError(err.message || "Could not import file."); }
    finally { setUploading(false); }
  };

  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); };

  return (
    <main className="page admin-page">
      <header className="top">
        <div><h1>HEC Calendar Admin</h1><p className="muted">Local calendar data. No Google Sheet connection required.</p></div>
        <button type="button" className="link-btn" onClick={logout}>Sign out</button>
      </header>

      <section className="admin-card">
        <div className="section-title-row"><h2>{editing === null ? "Add entry" : "Edit entry"}</h2>{editing !== null && <button type="button" className="link-btn" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}>Cancel edit</button>}</div>
        <form className="admin-form" onSubmit={submit}>
          <div className="field"><label htmlFor="startDate">Start date</label><input id="startDate" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} /></div>
          <div className="field"><label htmlFor="endDate">End date</label><input id="endDate" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          <div className="field"><label htmlFor="type">Type</label><input id="type" list="type-options" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required /><datalist id="type-options"><option value="Exam" /><option value="Event" /><option value="Sport" /><option value="HPL" /></datalist></div>
          <div className="field field-wide"><label htmlFor="title">Title</label><input id="title" type="text" required placeholder="e.g. DBMS CAT-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field field-wide"><label htmlFor="details">Details</label><textarea id="details" rows="3" placeholder="Optional details, venue, batch information, etc." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
          <button type="submit" disabled={busy}>{busy ? "Saving…" : editing === null ? "Add to calendar" : "Save changes"}</button>
        </form>
      </section>

      <section className="admin-card">
        <div className="section-title-row"><div><h2>Manual file import</h2><p className="muted">Upload CSV or JSON. Use Replace to rebuild the calendar or Append to add rows.</p></div><a className="button-secondary" href="/api/admin/export">Export current CSV</a></div>
        <form className="upload-form" onSubmit={upload}>
          <input name="file" type="file" accept=".csv,.json,text/csv,application/json" required />
          <select name="mode" defaultValue="replace"><option value="replace">Replace all calendar data</option><option value="append">Append to existing data</option></select>
          <button type="submit" disabled={uploading}>{uploading ? "Importing…" : "Import file"}</button>
        </form>
        <p className="hint">CSV columns: <code>Start Date, End Date, Type, Title, Details</code>. For a single-day item, Start Date and End Date can be the same.</p>
      </section>

      {message && <p className="status status-success">{message}</p>}
      {error && <p className="status status-error">{error}</p>}

      <section className="admin-card">
        <div className="section-title-row"><h2>Entries ({entries.length})</h2><button type="button" className="button-secondary" onClick={loadEntries}>Refresh</button></div>
        {loadState === "loading" && <p className="status">Loading…</p>}
        {loadState === "error" && <p className="status status-error">{loadError}</p>}
        {loadState === "ok" && entries.length === 0 && <p className="status">No entries.</p>}
        {loadState === "ok" && entries.length > 0 && <div className="table-wrap"><table className="entries-table"><thead><tr><th>Dates</th><th>Type</th><th>Title</th><th>Details</th><th>Actions</th></tr></thead><tbody>{entries.map((e) => <tr key={e.index}><td>{e.startDate === e.endDate ? e.startDate : `${e.startDate} → ${e.endDate}`}</td><td>{e.type}</td><td>{e.title}</td><td>{e.details}</td><td className="actions"><button type="button" className="link-btn" onClick={() => editEntry(e)}>Edit</button><button type="button" className="link-btn danger" onClick={() => removeEntry(e.index, e.title)}>Delete</button></td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
