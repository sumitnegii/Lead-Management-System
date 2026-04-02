"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface Lead {
  lead_id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: number;
  status: string;
  assigned_agent: string;
  agent_name?: string;
  created_time: string;
  last_update?: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatBudget(n: number): string {
  if (!n) return "N/A";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const safeName = name || "?";
  const initials = safeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const palette = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#14b8a6","#f97316"];
  const c = palette[(safeName.charCodeAt(0) || 0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── Sort Icon (outside component to avoid re-creation) ───────────────────────
function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy: string; sortDir: string }) {
  return (
    <span style={{ marginLeft: 4, opacity: sortBy === col ? 1 : 0.3, fontSize: 10 }}>
      {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = 0;
    const step = Math.ceil(target / 30);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Copied!"); }}
      title="Copy phone"
      style={{ padding: "3px 7px", border: "1px solid #e5e7eb", borderRadius: 6, background: copied ? "#ecfdf5" : "#f8fafc", color: copied ? "#10b981" : "#9ca3af", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
      {copied ? "✓" : "Copy"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AgentDashboard = () => {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "closed">("all");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "name">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [agentChatId, setAgentChatId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem("crm_role");
    const chatId = localStorage.getItem("crm_chatId");
    const userRaw = localStorage.getItem("crm_user");
    if (!chatId || role !== "agent") { router.replace("/login"); return; }
    setAgentChatId(chatId);
    if (userRaw) { try { const u = JSON.parse(userRaw); setAgentName(u.name || ""); } catch {} }
  }, [router]);

  const fetchLeads = async (chatId?: string) => {
    const id = chatId || agentChatId;
    if (!id) return;
    setError(null);
    try {
      const res = await fetch(`/api/my-leads/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (agentChatId) { setLoading(true); fetchLeads(agentChatId); } }, [agentChatId]);
  useEffect(() => {
    if (!agentChatId) return;
    const t = setInterval(fetchLeads, 30000);
    return () => clearInterval(t);
  }, [agentChatId]);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setExpandedId(null); setSearchTerm(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    ["crm_token","crm_role","crm_user","crm_chatId"].forEach(k => localStorage.removeItem(k));
    router.push("/login");
  };

  const handleMarkClosed = async (leadId: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/update-lead", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, status: "closed", assigned_agent: agentChatId }) });
      if (!res.ok) throw new Error();
      toast.success("Lead closed ✓");
      fetchLeads();
    } catch { toast.error("Failed to update"); }
    finally { setUpdatingId(null); }
  };

  const handleUnassign = async (leadId: string) => {
    if (!confirm("Move this lead back to the queue?")) return;
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/unassign-lead", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId }) });
      if (!res.ok) throw new Error();
      toast.success("Lead returned to queue");
      setExpandedId(null);
      fetchLeads();
    } catch { toast.error("Failed"); }
    finally { setUpdatingId(null); }
  };

  const handleSaveNote = async (lead: Lead) => {
    const note = noteMap[lead.lead_id] ?? lead.notes ?? "";
    setSavingNote(lead.lead_id);
    try {
      const res = await fetch("/api/update-lead", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: lead.lead_id, status: lead.status, assigned_agent: agentChatId, notes: note }) });
      if (!res.ok) throw new Error();
      toast.success("Note saved");
      fetchLeads();
    } catch { toast.error("Failed to save note"); }
    finally { setSavingNote(null); }
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads
      .filter(l => {
        const ms = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.requirement?.toLowerCase().includes(q) || l.lead_id?.toLowerCase().includes(q);
        const mst = filterStatus === "all" || l.status === filterStatus;
        return ms && mst;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "budget") diff = (a.budget || 0) - (b.budget || 0);
        else if (sortBy === "name") diff = a.name.localeCompare(b.name);
        else diff = new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
        return sortDir === "asc" ? diff : -diff;
      });
  }, [leads, searchTerm, filterStatus, sortBy, sortDir]);

  const stats = useMemo(() => {
    const active = leads.filter(l => l.status === "assigned");
    const closed = leads.filter(l => l.status === "closed");
    const highValue = leads.filter(l => (l.budget || 0) >= 500000);
    const convRate = leads.length > 0 ? Math.round((closed.length / leads.length) * 100) : 0;
    const totalBudget = active.reduce((s, l) => s + (l.budget || 0), 0);
    return { total: leads.length, active: active.length, closed: closed.length, highValue: highValue.length, convRate, totalBudget };
  }, [leads]);

  const hour = mounted ? new Date().getHours() : 12;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Return null on the server — prevents ANY hydration mismatch
  // The loading spinner only ever renders client-side after mount
  if (!mounted) return null;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#6366f1", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>Loading your workspace…</p>
      </div>
    </div>
  );

  // SortIcon is defined outside the component (see top of file)

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none} button{font-family:inherit;cursor:pointer;border:none;outline:none} input,textarea{font-family:inherit;outline:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;max-height:0;transform:translateY(-6px)}to{opacity:1;max-height:600px;transform:translateY(0)}}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.5}}
        .row-wrap{transition:background .15s;cursor:pointer}
        .row-wrap:hover{background:#f8fafc!important}
        .row-wrap.expanded{background:#fafaff!important}
        .btn{transition:all .15s;display:inline-flex;align-items:center;gap:5px}
        .btn:hover{opacity:.82;transform:translateY(-1px)}
        .btn:active{transform:translateY(0)}
        .sort-th{cursor:pointer;user-select:none;transition:color .15s}
        .sort-th:hover{color:#6366f1!important}
        .tab{border-bottom:2px solid transparent;transition:all .15s;cursor:pointer}
        .tab.active{border-bottom-color:#6366f1;color:#6366f1!important}
        .tab:hover:not(.active){color:#374151!important}
        .sidebar-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:#64748b;font-size:14px;font-weight:500;transition:all .15s;cursor:pointer}
        .sidebar-link:hover{background:#f1f5f9;color:#0f172a}
        .sidebar-link.active{background:#ede9fe;color:#6d28d9;font-weight:600}
        .stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px 22px;transition:box-shadow .2s,border-color .2s}
        .stat-card:hover{box-shadow:0 4px 20px rgba(99,102,241,.08);border-color:#c7d2fe}
        .expand-section{animation:slideDown .2s ease;overflow:hidden}
        .badge-hot{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700}
        .badge-new{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:999px}
        ::-webkit-scrollbar-thumb:hover{background:#d1d5db}
        @media(max-width:900px){
          .sidebar{position:fixed!important;transform:translateX(-100%);transition:transform .25s;z-index:100!important}
          .sidebar.open{transform:translateX(0)!important}
          .main{margin-left:0!important}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important}
          .hide-mobile{display:none!important}
        }
        @media(max-width:600px){
          .stat-grid{grid-template-columns:1fr!important}
          .topbar-pad{padding:0 16px!important}
          .main-pad{padding:20px 16px 40px!important}
        }
      `}</style>

      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }, success: { iconTheme: { primary: "#10b981", secondary: "#fff" } } }} />

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{ width: 220, background: "#fff", borderRight: "1px solid #e5e7eb", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>LeadCRM</div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginTop: 1 }}>Agent Portal</div>
            </div>
          </div>
        </div>

        {/* Agent Profile */}
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ background: "linear-gradient(135deg,#ede9fe,#e0f2fe)", border: "1px solid #c4b5fd", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={agentName || "Agent"} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agentName || "Agent"}</div>
              <div style={{ fontSize: 10, color: "#6d28d9", fontFamily: "monospace", fontWeight: 600, marginTop: 1 }}>{agentChatId}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, animation: "pulse2 2s ease infinite" }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 6 }}>Workspace</div>
          <div className="sidebar-link active">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            My Leads
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: "#6d28d9", color: "#fff", borderRadius: 999, padding: "1px 7px" }}>{stats.active}</span>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 8px 6px" }}>Quick Stats</div>
          {[
            { label: "High-Value Leads", val: stats.highValue, color: "#f59e0b" },
            { label: "Conversion Rate",  val: `${stats.convRate}%`, color: "#10b981" },
            { label: "Pipeline Value",   val: formatBudget(stats.totalBudget), color: "#6366f1" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "14px 10px", borderTop: "1px solid #f1f5f9" }}>
          <button onClick={handleLogout} className="sidebar-link btn" style={{ width: "100%", color: "#ef4444", background: "none" }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main" style={{ marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 32px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }} className="topbar-pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{greeting}, {agentName?.split(" ")[0] || "Agent"} 👋</h1>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>·</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{lastRefresh ? `Last synced ${timeAgo(lastRefresh.toISOString())}` : "Syncing…"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live dot */}
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 999, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse2 2s ease infinite" }} />
              Live
            </span>
            {/* Refresh */}
            <button onClick={() => { setLoading(true); fetchLeads(); }} className="btn" style={{ padding: "6px 13px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontSize: 13, fontWeight: 500 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 32px 48px", animation: "fadeIn .3s ease" }} className="main-pad">

          {/* ── STAT CARDS ── */}
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Total Leads",     value: stats.total,    sub: "All time",             icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#6366f1", bg: "#eef2ff" },
              { label: "Active",          value: stats.active,   sub: "In progress",          icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "#10b981", bg: "#ecfdf5" },
              { label: "Closed",          value: stats.closed,   sub: `${stats.convRate}% rate`, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#6b7280", bg: "#f3f4f6" },
              { label: "High Value",      value: stats.highValue, sub: "≥ ₹5L budget",        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1", color: "#f59e0b", bg: "#fffbeb" },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" fill="none" stroke={s.color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon}/></svg>
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  <Counter target={s.value} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
                {/* Progress bar */}
                {stats.total > 0 && (
                  <div style={{ marginTop: 12, height: 3, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: s.color, width: `${Math.round((s.value / stats.total) * 100)}%`, transition: "width 1s ease" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── TABLE PANEL ── */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>

            {/* Panel header: tabs + search + sort */}
            <div style={{ padding: "0 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 2 }}>
                {(["all","assigned","closed"] as const).map(s => {
                  const count = s === "all" ? leads.length : s === "assigned" ? stats.active : stats.closed;
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`tab${filterStatus === s ? " active" : ""}`}
                      style={{ padding: "14px 14px 12px", fontSize: 13, fontWeight: 600, background: "none", color: filterStatus === s ? "#6366f1" : "#6b7280" }}>
                      {s === "all" ? "All" : s === "assigned" ? "Active" : "Closed"}
                      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: filterStatus === s ? "#ede9fe" : "#f3f4f6", color: filterStatus === s ? "#6366f1" : "#94a3b8" }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Sort */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                {/* Sort */}
                <select value={`${sortBy}-${sortDir}`} onChange={e => { const [col, dir] = e.target.value.split("-"); setSortBy(col as typeof sortBy); setSortDir(dir as typeof sortDir); }}
                  style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", background: "#f8fafc", cursor: "pointer" }}>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="budget-desc">Highest budget</option>
                  <option value="budget-asc">Lowest budget</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                </select>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input ref={searchRef} type="text" placeholder="Search… (⌘K)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: 30, paddingRight: 12, height: 34, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#0f172a", width: 200, transition: "width .2s,border-color .2s" }}
                    onFocus={e => { e.target.style.width = "260px"; e.target.style.borderColor = "#818cf8"; }}
                    onBlur={e => { e.target.style.width = "200px"; e.target.style.borderColor = "#e5e7eb"; }} />
                </div>
              </div>
            </div>

            {/* ── TABLE ── */}
            {error ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: "#ef4444", fontWeight: 600 }}>Could not load leads</p>
                <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4, marginBottom: 16 }}>{error}</p>
                <button onClick={() => fetchLeads()} className="btn" style={{ padding: "8px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#ef4444", fontWeight: 600, fontSize: 13 }}>Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "80px 24px", textAlign: "center", animation: "fadeIn .3s ease" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="24" height="24" fill="none" stroke="#d1d5db" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <p style={{ fontWeight: 700, color: "#374151", fontSize: 15 }}>{searchTerm ? "No results found" : "No leads yet"}</p>
                <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 6 }}>{searchTerm ? `Nothing matched "${searchTerm}"` : "Your assigned leads will appear here."}</p>
                {searchTerm && <button onClick={() => setSearchTerm("")} className="btn" style={{ marginTop: 14, padding: "7px 16px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, fontSize: 13 }}>Clear search</button>}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {[
                        { label: "Lead",        col: "name",   sortable: true },
                        { label: "Phone",        col: null,     sortable: false },
                        { label: "Budget",       col: "budget", sortable: true },
                        { label: "Status",       col: null,     sortable: false },
                        { label: "Assigned",     col: "date",   sortable: true },
                        { label: "Actions",      col: null,     sortable: false },
                      ].map(h => (
                        <th key={h.label} onClick={h.sortable ? () => toggleSort(h.col as typeof sortBy) : undefined}
                          className={h.sortable ? "sort-th" : ""}
                          style={{ padding: "9px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: h.sortable && sortBy === h.col ? "#6366f1" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {h.label}{h.sortable && <SortIcon col={h.col!} sortBy={sortBy} sortDir={sortDir} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead, idx) => {
                      const isActive = lead.status === "assigned";
                      const isUpdating = updatingId === lead.lead_id;
                      const isExpanded = expandedId === lead.lead_id;
                      const isHighValue = (lead.budget || 0) >= 500000;
                      const isNew = (Date.now() - new Date(lead.created_time).getTime()) < 86400000 * 2;
                      const noteVal = noteMap[lead.lead_id] ?? lead.notes ?? "";

                      return (
                        <React.Fragment key={lead.lead_id}>
                          {/* Main row */}
                          <tr
                            className={`row-wrap${isExpanded ? " expanded" : ""}`}
                            onClick={() => setExpandedId(isExpanded ? null : lead.lead_id)}
                            style={{ borderBottom: isExpanded ? "none" : "1px solid #f8fafc", background: isExpanded ? "#fafaff" : "#fff", animationDelay: `${idx * 0.04}s`, animation: "fadeIn .2s ease both" }}>

                            {/* Lead */}
                            <td style={{ padding: "13px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Avatar name={lead.name} size={32} />
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{lead.name}</span>
                                    {isHighValue && <span className="badge-hot">🔥 Hot</span>}
                                    {isNew && <span className="badge-new">New</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 1 }}>{lead.lead_id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td style={{ padding: "13px 18px" }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <a href={`tel:${lead.phone}`} style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{lead.phone}</a>
                                <CopyBtn text={lead.phone} />
                              </div>
                            </td>

                            {/* Budget */}
                            <td style={{ padding: "13px 18px" }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{formatBudget(lead.budget)}</span>
                            </td>

                            {/* Status */}
                            <td style={{ padding: "13px 18px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                color: isActive ? "#10b981" : "#6b7280",
                                background: isActive ? "#ecfdf5" : "#f9fafb",
                                border: `1px solid ${isActive ? "#a7f3d0" : "#e5e7eb"}` }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#10b981" : "#9ca3af", display: "inline-block", ...(isActive ? { animation: "pulse2 2s ease infinite" } : {}) }} />
                                {isActive ? "Active" : "Closed"}
                              </span>
                            </td>

                            {/* Time */}
                            <td style={{ padding: "13px 18px" }}>
                              <span style={{ fontSize: 12, color: "#94a3b8" }} title={new Date(lead.created_time).toLocaleString("en-IN")}>
                                {timeAgo(lead.created_time)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "13px 18px" }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <Link href={`/lead/${lead.lead_id}`} className="btn" style={{ padding: "6px 11px", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 7, color: "#6d28d9", fontSize: 12, fontWeight: 600 }}>View</Link>
                                {isActive && (
                                  <>
                                    <button onClick={() => handleMarkClosed(lead.lead_id)} disabled={isUpdating} className="btn"
                                      style={{ padding: "6px 10px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 7, color: "#059669", fontSize: 12, fontWeight: 600, opacity: isUpdating ? .5 : 1 }}>
                                      {isUpdating ? "…" : "Close"}
                                    </button>
                                    <button onClick={() => handleUnassign(lead.lead_id)} disabled={isUpdating} className="btn"
                                      style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#ef4444", fontSize: 12, fontWeight: 600, opacity: isUpdating ? .5 : 1 }}>
                                      {isUpdating ? "…" : "Unassign"}
                                    </button>
                                  </>
                                )}
                                {/* Expand chevron */}
                                <span style={{ color: "#cbd5e1", fontSize: 14, transition: "transform .2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                              </div>
                            </td>
                          </tr>

                          {/* ── EXPANDED ROW ── */}
                          {isExpanded && (
                            <tr style={{ background: "#fafaff", borderBottom: "1px solid #f1f5f9" }}>
                              <td colSpan={6} style={{ padding: "0 18px 18px 60px" }}>
                                <div className="expand-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingTop: 4 }}>
                                  {/* Requirement */}
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Requirement</div>
                                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                                      {lead.requirement || <span style={{ color: "#d1d5db" }}>No requirement added.</span>}
                                    </div>
                                  </div>
                                  {/* Quick Note */}
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                      Quick Note
                                      {lead.notes && <span style={{ marginLeft: 6, color: "#f59e0b", fontSize: 10 }}>● Has note</span>}
                                    </div>
                                    <textarea
                                      rows={3}
                                      placeholder="Add a private note about this lead…"
                                      value={noteVal}
                                      onChange={e => setNoteMap(m => ({ ...m, [lead.lead_id]: e.target.value }))}
                                      style={{ width: "100%", fontSize: 13, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", resize: "none", lineHeight: 1.5, transition: "border-color .2s" }}
                                      onFocus={e => { e.target.style.borderColor = "#818cf8"; }}
                                      onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                      <button onClick={() => handleSaveNote(lead)} disabled={savingNote === lead.lead_id} className="btn"
                                        style={{ padding: "6px 14px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, opacity: savingNote === lead.lead_id ? .6 : 1 }}>
                                        {savingNote === lead.lead_id ? "Saving…" : "Save Note"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: "#cbd5e1" }}>
              {filtered.length} of {leads.length} leads · Auto-refreshes every 30s
            </p>
            <p style={{ fontSize: 11, color: "#e5e7eb" }}>
              <kbd style={{ padding: "2px 6px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 11, color: "#6b7280" }}>⌘K</kbd> to search · <kbd style={{ padding: "2px 6px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 11, color: "#6b7280" }}>Esc</kbd> to clear
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;
