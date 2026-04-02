"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type Agent = {
  _id?: string;
  name: string;
  chatId: string;
  status: string;
  mobileNumber: string;
  email?: string;
  createdAt?: string;
};

type Credentials = { name: string; chatId: string; password: string };

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  active:   { label: "Active",   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
  inactive: { label: "Inactive", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
  busy:     { label: "Busy",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
  away:     { label: "Away",     color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
};

const defaultForm = { name: "", chatId: "", status: "active", mobileNumber: "" };

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const palette = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#14b8a6", "#f97316"];
  const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.02em" }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] || STATUS_CFG.inactive;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, ...(status === "active" ? { animation: "pulse 2s ease infinite" } : {}) }} />
      {s.label}
    </span>
  );
}

/* ─── Agent Detail Drawer ────────────────────────────────────────────────────── */
function AgentDrawer({ agent, onClose, onSaved, onRemoved }: {
  agent: Agent;
  onClose: () => void;
  onSaved: (a: Agent) => void;
  onRemoved: (chatId: string) => void;
}) {
  const [tab, setTab] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState({ name: agent.name, mobileNumber: agent.mobileNumber, status: agent.status });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agent.chatId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Agent updated");
      onSaved({ ...agent, ...data });
      setTab("view");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove agent "${agent.name}"? This cannot be undone.`)) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/agents/${agent.chatId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success(`"${agent.name}" removed`);
      onRemoved(agent.chatId);
      onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
    finally { setRemoving(false); }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)", zIndex: 40 }} />
      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 420, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 48px rgba(0,0,0,0.12)", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "22px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={agent.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace", marginTop: 2 }}>{agent.chatId}</div>
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, background: "#f8fafc", border: "1px solid #e5e7eb", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 24px" }}>
          {(["view","edit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 16px 10px", fontWeight: 600, fontSize: 13, background: "none", border: "none", borderBottom: `2px solid ${tab===t?"#6366f1":"transparent"}`, color: tab===t?"#6366f1":"#64748b", cursor: "pointer", textTransform: "capitalize" }}>
              {t === "view" ? "Details" : "Edit Agent"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "view" ? (
            <>
              {[
                { label: "Full Name",   value: agent.name },
                { label: "Agent ID",    value: agent.chatId,     mono: true },
                { label: "Mobile",      value: agent.mobileNumber },
                { label: "Email",       value: agent.email || "—" },
                { label: "Onboarded",   value: agent.createdAt ? new Date(agent.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              ].map(f => (
                <div key={f.label} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", fontFamily: f.mono ? "monospace" : undefined }}>{f.value}</div>
                </div>
              ))}
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Status</div>
                <StatusBadge status={agent.status} />
              </div>
            </>
          ) : (
            <>
              {[
                { label: "Full Name",     key: "name",         type: "text",  placeholder: "Agent name" },
                { label: "Mobile Number", key: "mobileNumber", type: "tel",   placeholder: "+91 XXXXX XXXXX" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 13px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#0f172a", outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Agent ID</label>
                <input value={agent.chatId} disabled style={{ width: "100%", padding: "10px 13px", background: "#f1f5f9", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "monospace", color: "#94a3b8", cursor: "not-allowed" }} />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Agent ID cannot be changed.</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ width: "100%", padding: "10px 13px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#0f172a", outline: "none", cursor: "pointer" }}>
                  {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ width: "100%", padding: "11px", background: "#6366f1", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving?"not-allowed":"pointer", opacity: saving?0.7:1, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Saving…</> : "Save Changes"}
              </button>
            </>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ padding: "14px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Danger Zone</div>
            <p style={{ fontSize: 12, color: "#f87171", marginBottom: 10, lineHeight: 1.5 }}>Permanently remove this agent. Assigned leads will become unassigned.</p>
            <button onClick={handleRemove} disabled={removing}
              style={{ width: "100%", padding: "9px", background: "#dc2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: removing?"not-allowed":"pointer", opacity: removing?0.7:1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {removing ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Removing…</> :
                <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Remove Agent</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AgentPage = () => {
  const [mounted, setMounted] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error();
      setAgents(await res.json());
    } catch { toast.error("Failed to load agents"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.chatId.trim() || !form.mobileNumber.trim()) { toast.error("All fields are required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Agent creation failed");
      setCredentials({ name: data.name, chatId: data.chatId, password: data.generatedPassword });
      setForm(defaultForm);
      setShowForm(false);
      fetchAgents();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create agent"); }
    finally { setSubmitting(false); }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(`Agent: ${credentials.name}\nID: ${credentials.chatId}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Credentials copied!");
  };

  const filtered = agents.filter(a => {
    const q = searchTerm.toLowerCase();
    return (!q || a.name.toLowerCase().includes(q) || a.chatId.includes(q) || a.mobileNumber.includes(q)) &&
      (filterStatus === "all" || a.status === filterStatus);
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === "active").length,
    busy: agents.filter(a => a.status === "busy").length,
    away: agents.filter(a => a.status === "away").length,
    inactive: agents.filter(a => a.status === "inactive").length,
  };

  if (!mounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Loading agents…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .agent-card { animation: fadeIn 0.25s ease both; transition: box-shadow 0.2s, border-color 0.2s; }
        .agent-card:hover { box-shadow: 0 4px 20px rgba(99,102,241,0.1); border-color: #c7d2fe !important; }
        .btn { transition: all 0.15s; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .form-input { transition: border-color 0.15s, box-shadow 0.15s; }
        .form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }, success: { iconTheme: { primary: "#10b981", secondary: "#fff" } } }} />

      {/* Drawers & Modals */}
      {selectedAgent && (
        <AgentDrawer
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSaved={a => { setAgents(p => p.map(x => x.chatId===a.chatId?a:x)); setSelectedAgent(a); }}
          onRemoved={id => { setAgents(p => p.filter(x => x.chatId!==id)); setSelectedAgent(null); }}
        />
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.15)", animation: "fadeIn .25s ease" }}>
            <div style={{ background: "linear-gradient(135deg, #059669, #10b981)", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Agent Onboarded!</div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Share these credentials with <strong>{credentials.name}</strong>. Password shown only once.</p>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px" }}>
                {[ { label: "Name", value: credentials.name, mono: false }, { label: "Agent ID (Login)", value: credentials.chatId, mono: true, color: "#6366f1", bg: "#eef2ff" }, { label: "Password", value: credentials.password, mono: true, color: "#059669", bg: "#ecfdf5" } ].map(f => (
                  <div key={f.label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontFamily: f.mono ? "monospace" : undefined, fontSize: f.mono ? 18 : 15, fontWeight: 700, color: f.color || "#0f172a", background: f.bg || "transparent", padding: f.bg ? "8px 12px" : 0, borderRadius: f.bg ? 8 : 0, letterSpacing: f.mono ? "0.06em" : undefined }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10 }}>
                <svg width="14" height="14" fill="none" stroke="#d97706" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <p style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>Password <strong>cannot be recovered</strong> after closing this window.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={copyCredentials} className="btn" style={{ flex: 1, padding: "11px", background: "#6366f1", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  {copied ? <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</> : <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy Credentials</>}
                </button>
                <button onClick={() => { setCredentials(null); setCopied(false); }} className="btn" style={{ flex: 1, padding: "11px", background: "#f1f5f9", border: "1px solid #e5e7eb", borderRadius: 12, color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Dashboard
            </Link>
            <span className="text-slate-200">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span className="text-sm font-bold text-slate-800">Agent Management</span>
            </div>
          </div>
          <button onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors btn">
            {showForm ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>Cancel</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Onboard Agent</>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total",    value: stats.total,    color: "#6366f1", bg: "#eef2ff" },
            { label: "Active",   value: stats.active,   color: "#059669", bg: "#ecfdf5" },
            { label: "Busy",     value: stats.busy,     color: "#dc2626", bg: "#fef2f2" },
            { label: "Away",     value: stats.away,     color: "#d97706", bg: "#fffbeb" },
            { label: "Inactive", value: stats.inactive, color: "#6b7280", bg: "#f3f4f6" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
              {stats.total > 0 && (
                <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ height: "100%", width: `${Math.round((s.value/stats.total)*100)}%`, background: s.color, borderRadius: 999, transition: "width 1s ease" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── ONBOARD FORM ── */}
        {showForm && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden mb-5" style={{ animation: "fadeIn .2s ease" }}>
            <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Onboard New Agent</div>
                <div className="text-xs text-slate-400 mt-0.5">A secure password is auto-generated and shown once.</div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Full Name",     key: "name",         type: "text", placeholder: "Agent full name" },
                  { label: "Chat ID",       key: "chatId",       type: "text", placeholder: "e.g. AGT-1001",   mono: true },
                  { label: "Mobile",        key: "mobileNumber", type: "tel",  placeholder: "+91 XXXXX XXXXX" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} required
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className={`form-input w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium ${f.mono ? "font-mono" : ""}`} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="form-input w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold cursor-pointer">
                    {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting}
                  className="btn flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
                  style={{ cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> Creating…</> :
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> Create & Generate Password</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SEARCH + FILTER ── */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 mb-5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search by name, ID, or phone…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="form-input w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="form-input px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 cursor-pointer">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {agents.length} agents</span>
        </div>

        {/* ── AGENT GRID ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <p className="font-bold text-slate-700 mb-1">{agents.length === 0 ? "No agents yet" : "No agents found"}</p>
            <p className="text-slate-400 text-sm">{agents.length === 0 ? 'Click "Onboard Agent" to add your first agent.' : "Try adjusting your search."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((agent, i) => (
              <div key={agent._id ?? agent.chatId} className="agent-card bg-white border border-slate-200/80 rounded-xl overflow-hidden" style={{ animationDelay: `${i * 0.04}s` }}>
                {/* Color accent top bar */}
                <div style={{ height: 3, background: STATUS_CFG[agent.status]?.dot || "#e5e7eb" }} />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={agent.name} size={40} />
                      <div>
                        <div className="font-bold text-slate-800 text-sm leading-tight">{agent.name}</div>
                        <StatusBadge status={agent.status} />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center flexShrink-0">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
                      </div>
                      <span className="font-mono font-semibold text-slate-600">{agent.chatId}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </div>
                      <a href={`tel:${agent.mobileNumber}`} className="hover:text-indigo-600 transition-colors">{agent.mobileNumber}</a>
                    </div>
                    {agent.createdAt && (
                      <div className="flex items-center gap-2.5 text-xs text-slate-500">
                        <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <span>{new Date(agent.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => setSelectedAgent(agent)}
                      className="btn flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      View / Edit
                    </button>
                    <button onClick={() => setSelectedAgent(agent)}
                      className="btn flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-lg transition-colors" title="Remove agent">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {filtered.length} of {agents.length} agents{searchTerm && ` · "${searchTerm}"`}{filterStatus !== "all" && ` · ${STATUS_CFG[filterStatus]?.label}`}
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
