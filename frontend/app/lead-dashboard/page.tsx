"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Lead {
  lead_id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: number;
  user_chat_id: number;
  status: string;
  assigned_agent: string;
  previous_agent: string;
  last_update: string;
  created_time: string;
  agent_name?: string;
}
interface Agent { id: string; name: string; }

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const LEADS_PER_PAGE = 15;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  assigned: { label: "Assigned", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
  queued:   { label: "Queued",   color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
  on_hold:  { label: "On Hold",  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", dot: "#f97316" },
  closed:   { label: "Closed",   color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
  active:   { label: "Active",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  pending:  { label: "Pending",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#8b5cf6" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const getDateKey = (d: string) => { try { const dt = new Date(d); if (isNaN(dt.getTime())) return "unknown"; return dt.toISOString().split("T")[0]; } catch { return "unknown"; } };
const formatBudget = (n: number) => { if (!n) return "—"; if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`; if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (n >= 1000) return `₹${(n/1000).toFixed(0)}K`; return `₹${n}`; };
const timeAgo = (d: string) => { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff/60000); if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m/60); if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; };

function LeadAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#14b8a6"];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.02em" }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] || { label: status, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

/* ─── Export CSV ─────────────────────────────────────────────────────────────── */
function exportCSV(leads: Lead[]) {
  const headers = ["ID","Name","Phone","Budget","Status","Agent","Requirement","Created"];
  const rows = leads.map(l => [
    l.lead_id, l.name, l.phone, l.budget, l.status,
    l.agent_name ?? l.assigned_agent ?? "",
    `"${(l.requirement ?? "").replace(/"/g, "'")}"`,
    l.created_time
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  toast.success("CSV exported!");
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const Page = () => {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [showCal, setShowCal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "daywise">("table");
  const [sortCol, setSortCol] = useState<"created_time" | "budget" | "name" | "status">("created_time");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setLeads(await res.json());
        setLastSync(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } catch { setError("Failed to connect to backend"); }
    };
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) return;
        const data = await res.json();
        setAgents(data.map((a: any) => ({ id: a.chatId || a._id, name: a.name || "Unknown" })));
      } catch {}
    };
    setLoading(true);
    await Promise.all([fetchLeads(), fetchAgents()]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterAgent, filterDate, viewMode]);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } if (e.key === "Escape") { setSearchTerm(""); setExpandedId(null); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const availableDates = useMemo(() => {
    const m = new Map<string, { key: string; label: string; count: number }>();
    leads.forEach(l => {
      const k = getDateKey(l.created_time);
      if (!m.has(k)) {
        const d = new Date(l.created_time);
        const today = new Date(); const yest = new Date(); yest.setDate(today.getDate()-1);
        const label = d.toDateString() === today.toDateString() ? "Today" : d.toDateString() === yest.toDateString() ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        m.set(k, { key: k, label, count: 0 });
      }
      m.get(k)!.count++;
    });
    return Array.from(m.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads
      .filter(l => {
        const ms = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.requirement?.toLowerCase().includes(q) || l.lead_id?.toLowerCase().includes(q);
        const mst = filterStatus === "all" || l.status === filterStatus;
        const mag = filterAgent === "all" || l.assigned_agent === filterAgent;
        const mdt = filterDate === "all" || getDateKey(l.created_time) === filterDate;
        return ms && mst && mag && mdt;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortCol === "budget") diff = (a.budget||0) - (b.budget||0);
        else if (sortCol === "name") diff = a.name.localeCompare(b.name);
        else if (sortCol === "status") diff = a.status.localeCompare(b.status);
        else diff = new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
        return sortDir === "asc" ? diff : -diff;
      });
  }, [leads, searchTerm, filterStatus, filterAgent, filterDate, sortCol, sortDir]);

  const dayWise = useMemo(() => {
    const g = new Map<string, { label: string; leads: Lead[] }>();
    filtered.forEach(l => {
      const k = getDateKey(l.created_time);
      if (!g.has(k)) {
        const d = new Date(l.created_time);
        const today = new Date(); const yest = new Date(); yest.setDate(today.getDate()-1);
        const label = d.toDateString() === today.toDateString() ? "Today" : d.toDateString() === yest.toDateString() ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        g.set(k, { label, leads: [] });
      }
      g.get(k)!.leads.push(l);
    });
    return Array.from(g.entries()).sort(([a],[b]) => b.localeCompare(a));
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / LEADS_PER_PAGE);
  const paginated = useMemo(() => filtered.slice((currentPage-1)*LEADS_PER_PAGE, currentPage*LEADS_PER_PAGE), [filtered, currentPage]);

  const paginatedDayWise = useMemo(() => {
    const start = (currentPage-1)*LEADS_PER_PAGE, end = start+LEADS_PER_PAGE;
    let count = 0; const result: {key:string;label:string;leads:Lead[]}[] = [];
    for (const [key, {label, leads: dl}] of dayWise) {
      const ds = count, de = count + dl.length;
      if (de > start && ds < end) result.push({ key, label, leads: dl.slice(Math.max(0,start-ds), Math.min(dl.length,end-ds)) });
      count += dl.length;
    }
    return result;
  }, [dayWise, currentPage]);

  const stats = useMemo(() => ({
    total: leads.length,
    assigned: leads.filter(l => l.status==="assigned").length,
    queued: leads.filter(l => l.status==="queued").length,
    on_hold: leads.filter(l => l.status==="on_hold").length,
    closed: leads.filter(l => l.status==="closed").length,
    totalBudget: leads.reduce((s,l) => s+(l.budget||0), 0),
    convRate: leads.length ? Math.round((leads.filter(l=>l.status==="closed").length / leads.length)*100) : 0,
  }), [leads]);

  const toggleSort = (col: typeof sortCol) => { if (sortCol===col) setSortDir(d => d==="asc"?"desc":"asc"); else { setSortCol(col); setSortDir("desc"); } };

  if (!mounted) return null;

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Connection Failed</h2>
        <p className="text-slate-500 text-sm mb-5">{error}</p>
        <code className="block bg-slate-900 text-emerald-400 px-4 py-2.5 rounded-lg font-mono text-xs mb-5 text-left">cd backend && node server.js</code>
        <button onClick={() => { setError(null); fetchData(); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">Retry Connection</button>
      </div>
    </div>
  );

  /* ── Table rows ── */
  const renderRow = (lead: Lead, idx: number) => {
    const isExp = expandedId === lead.lead_id;
    const isNew = (Date.now() - new Date(lead.created_time).getTime()) < 86400000 * 2;
    const isHot = (lead.budget || 0) >= 500000;
    const prevAgent = agents.find(a => a.id === lead.previous_agent);
    return (
      <React.Fragment key={lead.lead_id}>
        <tr
          onClick={() => setExpandedId(isExp ? null : lead.lead_id)}
          className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
          style={{ background: isExp ? "#f5f5ff" : undefined }}
        >
          {/* Lead */}
          <td className="py-3.5 px-5">
            <div className="flex items-center gap-3">
              <LeadAvatar name={lead.name} size={32} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{lead.name}</span>
                  {isHot && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">🔥 Hot</span>}
                  {isNew && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">New</span>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.lead_id}</div>
              </div>
            </div>
          </td>
          {/* Phone */}
          <td className="py-3.5 px-5" onClick={e => e.stopPropagation()}>
            <a href={`tel:${lead.phone}`} className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors">{lead.phone}</a>
          </td>
          {/* Budget */}
          <td className="py-3.5 px-5">
            <span className="font-bold text-emerald-600 text-sm">{formatBudget(lead.budget)}</span>
          </td>
          {/* Status */}
          <td className="py-3.5 px-5"><StatusBadge status={lead.status} /></td>
          {/* Agent */}
          <td className="py-3.5 px-5">
            {lead.agent_name && lead.agent_name !== "Unassigned" ? (
              <div className="flex items-center gap-2">
                <LeadAvatar name={lead.agent_name} size={22} />
                <span className="text-xs font-semibold text-slate-700">{lead.agent_name}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Unassigned</span>
            )}
          </td>
          {/* Date */}
          <td className="py-3.5 px-5">
            <span className="text-xs text-slate-400" title={new Date(lead.created_time).toLocaleString("en-IN")}>{timeAgo(lead.created_time)}</span>
          </td>
          {/* Actions */}
          <td className="py-3.5 px-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/lead/${lead.lead_id}`} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors">Edit</Link>
              <button onClick={() => { navigator.clipboard.writeText(lead.phone); toast.success("Phone copied!"); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors">Copy</button>
            </div>
          </td>
          {/* Expand icon */}
          <td className="py-3.5 px-3">
            <span className="text-slate-300 text-sm inline-block transition-transform" style={{ transform: isExp ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
          </td>
        </tr>
        {/* Expanded detail */}
        {isExp && (
          <tr style={{ background: "#f8f8ff", borderBottom: "1px solid #e5e7eb" }}>
            <td colSpan={8} className="px-6 pt-0 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pl-10">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Requirement</div>
                  <div className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-xl p-3">{lead.requirement || <span className="italic text-slate-300">None</span>}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Previous Agent</div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3">
                    {prevAgent ? (
                      <div className="flex items-center gap-2"><LeadAvatar name={prevAgent.name} size={22}/><span className="text-sm text-slate-600">{prevAgent.name}</span></div>
                    ) : <span className="text-sm text-slate-400 italic">None</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Timeline</div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-1">
                    <div className="text-xs text-slate-500">Created: <span className="text-slate-700 font-medium">{new Date(lead.created_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                    {lead.last_update && <div className="text-xs text-slate-500">Updated: <span className="text-slate-700 font-medium">{new Date(lead.last_update).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></div>}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const TableHead = () => (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/60">
        {[
          { label: "Lead",    col: "name"         as const },
          { label: "Phone",   col: null },
          { label: "Budget",  col: "budget"       as const },
          { label: "Status",  col: "status"       as const },
          { label: "Agent",   col: null },
          { label: "Created", col: "created_time" as const },
          { label: "Actions", col: null },
          { label: "",        col: null },
        ].map(h => (
          <th key={h.label} onClick={h.col ? () => toggleSort(h.col!) : undefined}
            className={`py-3 px-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${h.col ? "cursor-pointer hover:text-indigo-500 transition-colors" : ""}`}>
            {h.label}
            {h.col && <span className="ml-1 opacity-50">{sortCol===h.col ? (sortDir==="asc"?"↑":"↓") : "↕"}</span>}
          </th>
        ))}
      </tr>
    </thead>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) pages.push(i); }
    else { pages.push(1); if (currentPage>3) pages.push("..."); for (let i=Math.max(2,currentPage-1);i<=Math.min(totalPages-1,currentPage+1);i++) pages.push(i); if (currentPage<totalPages-2) pages.push("..."); pages.push(totalPages); }
    return (
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <span className="text-xs text-slate-400">Showing {(currentPage-1)*LEADS_PER_PAGE+1}–{Math.min(currentPage*LEADS_PER_PAGE, filtered.length)} of {filtered.length}</span>
        <div className="flex gap-1">
          <button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></button>
          {pages.map((p,i) => p==="..." ? <span key={i} className="px-2 text-slate-400 text-xs self-center">…</span> : (
            <button key={p} onClick={()=>setCurrentPage(p as number)} className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-semibold transition-all ${currentPage===p?"bg-indigo-600 text-white":"text-slate-600 hover:bg-slate-200"}`}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></button>
        </div>
      </div>
    );
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .react-calendar { border: none !important; width: 100% !important; font-family: inherit !important; }
        .react-calendar__tile--active { background: #6366f1 !important; border-radius: 8px !important; }
        .react-calendar__tile:hover { background: #e0e7ff !important; border-radius: 8px !important; }
        .react-calendar__navigation button:hover { background: #f1f5f9 !important; border-radius: 8px; }
      `}</style>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }, success: { iconTheme: { primary: "#10b981", secondary: "#fff" } } }} />

      {/* ── TOPBAR ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <span className="text-sm font-800 text-slate-800 font-bold">LeadCRM</span>
            <span className="hidden sm:block text-slate-300">·</span>
            <span className="hidden sm:block text-xs text-slate-400">Sales Dashboard</span>
          </div>
          {/* Right */}
          <div className="flex items-center gap-2">
            {lastSync && <span className="text-[11px] text-slate-400 hidden md:block">Synced {lastSync}</span>}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-600 font-semibold">Live</span>
            </div>
            <button onClick={fetchData} title="Refresh" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <Link href="/agent" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>
              Manage Agents
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total",     value: stats.total,    color: "#6366f1", bg: "#eef2ff", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "Assigned",  value: stats.assigned, color: "#059669", bg: "#ecfdf5", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Queued",    value: stats.queued,   color: "#d97706", bg: "#fffbeb", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "On Hold",   value: stats.on_hold,  color: "#ea580c", bg: "#fff7ed", icon: "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Closed",    value: stats.closed,   color: "#6b7280", bg: "#f3f4f6", icon: "M5 13l4 4L19 7" },
            { label: "Conv. Rate",value: `${stats.convRate}%`, color: "#7c3aed", bg: "#f5f3ff", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
                <div style={{ background: s.bg, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" fill="none" stroke={s.color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={s.icon}/></svg>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
              {typeof s.value === "number" && stats.total > 0 && (
                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ height: "100%", width: `${Math.round((s.value/stats.total)*100)}%`, background: s.color, borderRadius: 999, transition: "width 1s ease" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── FILTER + SEARCH BAR ── */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input ref={searchRef} type="text" placeholder="Search leads… (⌘K)" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all" />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          {/* Agent filter */}
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer">
            <option value="all">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Date filter */}
          <button onClick={() => setShowCal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-all cursor-pointer ${filterDate !== "all" ? "bg-indigo-50 border-indigo-300 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {filterDate !== "all" ? availableDates.find(d => d.key===filterDate)?.label ?? filterDate : "All Dates"}
            {filterDate !== "all" && <button onClick={e => { e.stopPropagation(); setFilterDate("all"); }} className="ml-1 text-indigo-400 hover:text-indigo-600">✕</button>}
          </button>

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {[
              { v: "table",   icon: "M4 6h16M4 10h16M4 14h16M4 18h16", label: "Table" },
              { v: "daywise", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Day View" },
            ].map(b => (
              <button key={b.v} onClick={() => setViewMode(b.v as any)} title={b.label}
                className={`p-1.5 rounded-md transition-all ${viewMode===b.v?"bg-white text-indigo-600 shadow-sm":"text-slate-400 hover:text-slate-600"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon}/></svg>
              </button>
            ))}
          </div>

          {/* Export */}
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>

        {/* ── LEADS TABLE / DAY-WISE ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No leads found</h3>
            <p className="text-slate-400 text-sm">{searchTerm ? `Nothing matched "${searchTerm}"` : "Try adjusting your filters."}</p>
            {(searchTerm||filterStatus!=="all"||filterAgent!=="all"||filterDate!=="all") && (
              <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterAgent("all"); setFilterDate("all"); }} className="mt-4 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">Clear all filters</button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" suppressHydrationWarning>
                <TableHead />
                <tbody>{paginated.map((l, i) => renderRow(l, i))}</tbody>
              </table>
            </div>
            <Pagination />
          </div>
        ) : (
          <div className="space-y-5">
            {paginatedDayWise.map(({ key, label, leads: dl }) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{label}</div>
                      <div className="text-[11px] text-slate-400">{key !== "unknown" ? key : "Unknown date"}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">{dl.length} lead{dl.length!==1?"s":""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" suppressHydrationWarning>
                    <TableHead />
                    <tbody>{dl.map((l, i) => renderRow(l, i))}</tbody>
                  </table>
                </div>
              </div>
            ))}
            {totalPages > 1 && <div className="bg-white rounded-xl border border-slate-200/80"><Pagination /></div>}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filtered.length} of {leads.length} leads{searchTerm&&` · "${searchTerm}"`}{filterStatus!=="all"&&` · ${STATUS_CFG[filterStatus]?.label}`}{filterAgent!=="all"&&` · ${agents.find(a=>a.id===filterAgent)?.name}`}</span>
          <span>Page {currentPage} of {totalPages||1} · <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">⌘K</kbd> to search</span>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCal && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowCal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Filter by Date</h3>
                <button onClick={() => setShowCal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <Calendar
                onChange={v => { if (v instanceof Date) setFilterDate(getDateKey(v.toISOString())); setShowCal(false); }}
                value={filterDate !== "all" ? new Date(filterDate) : new Date()}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const count = availableDates.find(d => d.key===getDateKey(date.toISOString()))?.count||0;
                    return count > 0 ? <div className="text-[9px] font-bold text-indigo-600 mt-0.5">{count}</div> : null;
                  }
                  return null;
                }}
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => { setFilterDate("all"); setShowCal(false); }} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Clear</button>
                <button onClick={() => setShowCal(false)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors">Done</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;